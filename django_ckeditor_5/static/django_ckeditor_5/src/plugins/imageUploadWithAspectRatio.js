import { Plugin } from '@ckeditor/ckeditor5-core/';
import { ButtonView } from '@ckeditor/ckeditor5-ui/';
import { add } from '@ckeditor/ckeditor5-utils/src/translation-service';
import icon43 from './icons/aspectRatio43.js';
import icon21 from './icons/aspectRatio21.js';

export default class ImageUploadWithAspectRatioPlugin extends Plugin {
  static get pluginName() { return 'ImageUploadWithAspectRatio'; }

  static get requires() {
    return ['ImageInsert', 'ImageAspectRatio'];
  }

  init() {
    const editor = this.editor;
    const { t } = editor.locale;

    // Add translations
    add('en', {
      'Aspect ratio 4:3 - Compact format (right-aligned)': 'Aspect ratio 4:3 - Compact format (right-aligned)',
      'Aspect ratio 2:1 - Wide format (full width)': 'Aspect ratio 2:1 - Wide format (full width)',
    }, n => n !== 1);
    add('de', {
      'Aspect ratio 4:3 - Compact format (right-aligned)': '4:3 Seitenverhältnis - Kompaktes Format (rechtsbündig)',
      'Aspect ratio 2:1 - Wide format (full width)': '2:1 Seitenverhältnis - Breites Format (volle Breite)',
    }, n => n !== 1);

    // Create button for 4:3 upload
    editor.ui.componentFactory.add('imageUpload43', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        tooltip: t('Aspect ratio 4:3 - Compact format (right-aligned)'),
        icon: icon43
      });
      
      view.on('execute', () => {
        this.triggerImageUpload(editor, '43');
      });
      
      return view;
    });

    // Create button for 2:1 upload
    editor.ui.componentFactory.add('imageUpload21', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        tooltip: t('Aspect ratio 2:1 - Wide format (full width)'),
        icon: icon21
      });
      
      view.on('execute', () => {
        this.triggerImageUpload(editor, '21');
      });
      
      return view;
    });
  }

  triggerImageUpload(editor, aspectRatio) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = false;
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        const imageUploadCommand = editor.commands.get('imageUpload');
        if (imageUploadCommand && imageUploadCommand.isEnabled) {
          imageUploadCommand.execute({ file: files[0] });
          this.applyAspectRatioAfterUpload(editor, aspectRatio);
        }
      }
      
      if (fileInput.parentNode) {
        fileInput.parentNode.removeChild(fileInput);
      }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  applyAspectRatioAfterUpload(editor, aspectRatio) {
    let retryCount = 0;
    const maxRetries = 20;
    
    const checkAndApply = () => {
      const lastImage = this.findLastInsertedImage(editor);
      if (lastImage) {
        const viewElement = editor.editing.mapper.toViewElement(lastImage);
        if (!viewElement && retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkAndApply, 50);
          return;
        }
        
        // Set aspect ratio attribute in model
        editor.model.change(writer => {
          writer.setAttribute('aspectRatio', aspectRatio, lastImage);
        });
        
        // Apply CSS class after a short delay
        setTimeout(() => {
          this.applyCssClass(editor, lastImage, aspectRatio);
        }, 300);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkAndApply, 50);
      }
    };
    
    setTimeout(checkAndApply, 100);
  }

  applyCssClass(editor, imageElement, aspectRatio) {
    const viewElement = editor.editing.mapper.toViewElement(imageElement);
    if (!viewElement) return;
    
    // Find figure element in view
    let figureElement = viewElement.parent;
    if (!figureElement || !figureElement.is('element', 'figure')) {
      let current = viewElement;
      while (current && current.parent) {
        current = current.parent;
        if (current.is('element', 'figure')) {
          figureElement = current;
          break;
        }
      }
    }
    
    const expectedClass = `image-aspect-ratio-${aspectRatio}`;
    
    // Try to apply via view writer
    if (figureElement && figureElement.is('element', 'figure')) {
      editor.editing.view.change(writer => {
        writer.removeClass(['image-aspect-ratio-43', 'image-aspect-ratio-21'], figureElement);
        writer.addClass(expectedClass, figureElement);
      });
    } else {
      // Fallback: Apply directly to DOM
      const domElement = editor.editing.view.domConverter.mapViewToDom(viewElement);
      if (domElement) {
        const figureDom = domElement.closest('figure');
        if (figureDom) {
          figureDom.classList.remove('image-aspect-ratio-43', 'image-aspect-ratio-21');
          figureDom.classList.add(expectedClass);
        }
      }
    }
  }

  findLastInsertedImage(editor) {
    const model = editor.model;
    const root = model.document.getRoot();
    const range = model.createRangeIn(root);
    const items = Array.from(range.getItems());
    
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      let imageElement = null;
      
      if (item.name === 'imageBlock' || item.name === 'imageInline') {
        imageElement = item;
      } else if (item.parent && (item.parent.name === 'imageBlock' || item.parent.name === 'imageInline')) {
        imageElement = item.parent;
      }
      
      if (imageElement) {
        return imageElement;
      }
    }
    return null;
  }
}
