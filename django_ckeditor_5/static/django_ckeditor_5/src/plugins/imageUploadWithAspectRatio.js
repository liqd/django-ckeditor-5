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
    const { t} = editor.locale;

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
    
    // Store the selection position before upload
    const selectionBeforeUpload = editor.model.document.selection.getFirstPosition();
    
    fileInput.addEventListener('change', (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        const imageUploadCommand = editor.commands.get('imageUpload');
        if (imageUploadCommand && imageUploadCommand.isEnabled) {
          imageUploadCommand.execute({ file: files[0] });
          this.applyAspectRatioAfterUpload(editor, aspectRatio, selectionBeforeUpload);
        }
      }
      
      if (fileInput.parentNode) {
        fileInput.parentNode.removeChild(fileInput);
      }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  applyAspectRatioAfterUpload(editor, aspectRatio, selectionBeforeUpload) {
    let retryCount = 0;
    const maxRetries = 20;
    
    const checkAndApply = () => {
      // Find the image that was inserted at or after the selection position
      const insertedImage = this.findInsertedImageAtPosition(editor, selectionBeforeUpload);
      if (insertedImage) {
        // Set aspect ratio attribute in model
        // The downcast handler in imageAspectRatio.js will automatically apply the CSS class
        editor.model.change(writer => {
          writer.setAttribute('aspectRatio', aspectRatio, insertedImage);
        });
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkAndApply, 50);
      }
    };
    
    setTimeout(checkAndApply, 100);
  }

  findInsertedImageAtPosition(editor, positionBeforeUpload) {
    const model = editor.model;
    const root = model.document.getRoot();
    
    // Collect all images in the document
    const allImages = [];
    const allItems = Array.from(model.createRangeIn(root).getItems());
    for (const item of allItems) {
      let imageElement = null;
      if (item.name === 'imageBlock' || item.name === 'imageInline') {
        imageElement = item;
      } else if (item.parent && (item.parent.name === 'imageBlock' || item.parent.name === 'imageInline')) {
        imageElement = item.parent;
      }
      if (imageElement && !allImages.includes(imageElement)) {
        allImages.push(imageElement);
      }
    }
    
    // Find all images WITHOUT aspectRatio attribute (newly inserted)
    const imagesWithoutAspectRatio = [];
    for (const img of allImages) {
      if (!img.getAttribute('aspectRatio')) {
        imagesWithoutAspectRatio.push(img);
      }
    }
    
    // If there's only one image without aspectRatio, use it
    if (imagesWithoutAspectRatio.length === 1) {
      return imagesWithoutAspectRatio[0];
    }
    
    // If multiple images without aspectRatio, find the one at or after the stored position
    if (imagesWithoutAspectRatio.length > 0 && positionBeforeUpload) {
      for (const img of imagesWithoutAspectRatio) {
        try {
          const imgPos = model.createPositionBefore(img);
          if (imgPos.isAfter(positionBeforeUpload) || imgPos.isEqual(positionBeforeUpload)) {
            return img;
          }
        } catch (e) {
          // If position comparison fails, continue
        }
      }
      // Fallback: use the first one
      return imagesWithoutAspectRatio[0];
    }
    
    // Fallback: if no position or all images have aspectRatio, use selected element or last image
    const currentSelection = model.document.selection;
    const selectedElement = currentSelection.getSelectedElement();
    if (selectedElement && (selectedElement.name === 'imageBlock' || selectedElement.name === 'imageInline')) {
      return selectedElement;
    }
    
    return allImages[allImages.length - 1] || null;
  }
}
