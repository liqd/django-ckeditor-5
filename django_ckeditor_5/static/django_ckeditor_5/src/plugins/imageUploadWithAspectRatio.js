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

    // Helper function to create upload buttons
    const createUploadButton = (name, aspectRatio, tooltipKey, icon) => {
      editor.ui.componentFactory.add(name, (locale) => {
        const view = new ButtonView(locale);
        view.set({
          tooltip: t(tooltipKey),
          icon: icon
        });
        
        view.on('execute', () => {
          this.triggerImageUpload(aspectRatio);
        });
        
        return view;
      });
    };

    createUploadButton('imageUpload43', '43', 'Aspect ratio 4:3 - Compact format (right-aligned)', icon43);
    createUploadButton('imageUpload21', '21', 'Aspect ratio 2:1 - Wide format (full width)', icon21);
  }

  triggerImageUpload(aspectRatio) {
    const editor = this.editor;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = false;
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        const imageUploadCommand = editor.commands.get('imageUpload');
        if (imageUploadCommand && imageUploadCommand.isEnabled) {
          const executeResult = imageUploadCommand.execute({ file: files[0] });
          
          // If execute returns a promise, wait for it
          if (executeResult && typeof executeResult.then === 'function') {
            await executeResult;
          }
          
          // Apply aspect ratio after upload
          await this.applyAspectRatioAfterUpload(aspectRatio);
        }
      }
      
      fileInput.remove();
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  async applyAspectRatioAfterUpload(aspectRatio) {
    const editor = this.editor;
    // Try to find the image immediately
    let insertedImage = this.findInsertedImage();
    
    // If not found, wait a bit and retry (fallback for async upload)
    if (!insertedImage) {
      await new Promise(resolve => setTimeout(resolve, 100));
      insertedImage = this.findInsertedImage();
    }
    
    if (insertedImage) {
      // Set aspect ratio attribute only in the model downcast will do the rest
      editor.model.change(writer => {
        writer.setAttribute('aspectRatio', aspectRatio, insertedImage);
      });
    }
  }

  findInsertedImage() {
    const editor = this.editor;
    const model = editor.model;
    const root = model.document.getRoot();
    
    // Find the first image without aspectRatio attribute (newly inserted)
    const allItems = Array.from(model.createRangeIn(root).getItems());
    for (const item of allItems) {
      let imageElement = null;
      if (item.name === 'imageBlock' || item.name === 'imageInline') {
        imageElement = item;
      } else if (item.parent && (item.parent.name === 'imageBlock' || item.parent.name === 'imageInline')) {
        imageElement = item.parent;
      }
      
      if (imageElement && !imageElement.getAttribute('aspectRatio')) {
        return imageElement;
      }
    }
    
    return null;
  }
}
