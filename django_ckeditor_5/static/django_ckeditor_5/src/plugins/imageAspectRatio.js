import { Plugin } from '@ckeditor/ckeditor5-core/';
import { ButtonView } from '@ckeditor/ckeditor5-ui/';
import { add } from '@ckeditor/ckeditor5-utils/src/translation-service';
import icon43 from './icons/aspectRatio43.js';
import icon21 from './icons/aspectRatio21.js';

export default class ImageAspectRatioPlugin extends Plugin {
  static get pluginName() { return 'ImageAspectRatio'; }

  init() {
    const editor = this.editor;
    const { t } = editor.locale;

    // Add translations
    add('en', {
      'Aspect ratio 4:3': 'Aspect ratio 4:3',
      'Aspect ratio 2:1': 'Aspect ratio 2:1',
    }, n => n !== 1);
    add('de', {
      'Aspect ratio 4:3': '4:3 Seitenverhältnis',
      'Aspect ratio 2:1': '2:1 Seitenverhältnis',
    }, n => n !== 1);

    // Extend schema to allow aspectRatio attribute on images
    editor.model.schema.extend('imageBlock', { allowAttributes: ['aspectRatio'] });
    editor.model.schema.extend('imageInline', { allowAttributes: ['aspectRatio'] });

    // Helper function to find the img element within view structure (figure or span)
    const findImgElement = (element) => {
      if (!element) return null;
      
      // Direct match: already an img
      if (element.is('element', 'img')) {
        return element;
      }
      
      // Search in children
      const children = Array.from(element.getChildren ? element.getChildren() : []);
      for (const child of children) {
        if (child.is && child.is('element', 'img')) {
          return child;
        }
        // Recursive search for nested structures
        if (child.is && child.is('element')) {
          const found = findImgElement(child);
          if (found) return found;
        }
      }
      
      return null;
    };

    // Downcast: Apply CSS classes to img element when aspectRatio attribute changes
    editor.conversion.for('downcast').add(dispatcher => {
      const handleAspectRatioChange = (evt, data, api) => {
        const htmlAttrs = data.item.getAttribute('htmlImgAttributes');
        if (htmlAttrs && htmlAttrs.classes) {
          const newClasses = htmlAttrs.classes.filter(cls => 
            cls !== 'image-aspect-ratio-43' && cls !== 'image-aspect-ratio-21'
          );
          
          editor.model.change(writer => {
            writer.setAttribute('htmlImgAttributes', {
              ...htmlAttrs,
              classes: newClasses
            }, data.item);
          });
        }
        
        const writer = api.writer;
        const viewElement = api.mapper.toViewElement(data.item);
        const imgElement = findImgElement(viewElement);
        
        if (!imgElement) {
          return;
        }
        
        // Remove old aspect ratio classes
        writer.removeClass('image-aspect-ratio-43', imgElement);
        writer.removeClass('image-aspect-ratio-21', imgElement);
        
        // Add new class if aspectRatio is set
        if (data.attributeNewValue) {
          const newClass = `image-aspect-ratio-${data.attributeNewValue}`;
          writer.addClass(newClass, imgElement);
        }
      };
      dispatcher.on('attribute:aspectRatio:imageBlock', handleAspectRatioChange, { priority: 'lowest' });
      dispatcher.on('attribute:aspectRatio:imageInline', handleAspectRatioChange, { priority: 'lowest' });
    });

    // Data Downcast: Same as above, but for saving (data view)
    editor.conversion.for('dataDowncast').add(dispatcher => {
      const handleDataAspectRatioChange = (evt, data, api) => {
        const writer = api.writer;
        const viewElement = api.mapper.toViewElement(data.item);
        const imgElement = findImgElement(viewElement);
        
        if (!imgElement) return;
        
        // Remove old aspect ratio classes
        writer.removeClass('image-aspect-ratio-43', imgElement);
        writer.removeClass('image-aspect-ratio-21', imgElement);
        
        // Add new class if aspectRatio is set
        if (data.attributeNewValue) {
          const newClass = `image-aspect-ratio-${data.attributeNewValue}`;
          writer.addClass(newClass, imgElement);
        }
      };
      dispatcher.on('attribute:aspectRatio:imageBlock', handleDataAspectRatioChange, { priority: 'lowest' });
      dispatcher.on('attribute:aspectRatio:imageInline', handleDataAspectRatioChange, { priority: 'lowest' });
    });

    // Upcast: Read CSS classes from img element and set aspectRatio attribute
    editor.conversion.for('upcast').add(dispatcher => {
      dispatcher.on('element:img', (evt, data, conversionApi) => {
        if (!data.modelRange) return;
        
        const viewItem = data.viewItem;
        let modelItem = null;
        
        // Find imageBlock/imageInline in modelRange
        for (const item of data.modelRange.getItems()) {
          if (item.name === 'imageBlock' || item.name === 'imageInline') {
            modelItem = item;
            break;
          }
        }
        
        // Fallback: check parent
        if (!modelItem) {
          const parent = data.modelRange.start.parent;
          if (parent && (parent.name === 'imageBlock' || parent.name === 'imageInline')) {
            modelItem = parent;
          }
        }
        
        if (!modelItem) return;
        
        // Read aspectRatio from CSS class
        if (viewItem.hasClass('image-aspect-ratio-43')) {
          conversionApi.writer.setAttribute('aspectRatio', '43', modelItem);
        } else if (viewItem.hasClass('image-aspect-ratio-21')) {
          conversionApi.writer.setAttribute('aspectRatio', '21', modelItem);
        }
      }, { priority: 'low' });
    });

    // Helper function to create aspect ratio buttons
    const createAspectRatioButton = (name, label, tooltipKey, icon, ratio, isActiveCheck) => {
      editor.ui.componentFactory.add(name, locale => {
        const view = new ButtonView(locale);
        view.set({ 
          label, 
          tooltip: t(tooltipKey), 
          withText: false, 
          icon 
        });
        view.on('execute', () => this.apply(ratio));
        
        const updateButtonState = () => {
          const selection = editor.model.document.selection;
          const selectedElement = selection.getSelectedElement();
          
          if (selectedElement && (selectedElement.name === 'imageBlock' || selectedElement.name === 'imageInline')) {
            const aspectRatio = selectedElement.getAttribute('aspectRatio');
            view.set('isOn', isActiveCheck(aspectRatio));
            view.set('isEnabled', true);
          } else {
            view.set('isOn', false);
            view.set('isEnabled', false);
          }
        };
        
        editor.model.document.selection.on('change', updateButtonState);
        editor.model.document.on('change:data', updateButtonState);
        updateButtonState();
        
        return view;
      });
    };

    createAspectRatioButton('imageAspectRatio43', '4:3', 'Aspect ratio 4:3', icon43, '43', (ar) => ar === '43');
    createAspectRatioButton('imageAspectRatio21', '2:1', 'Aspect ratio 2:1', icon21, '21', (ar) => ar !== '43');
  }

  apply(ratio) {
    const editor = this.editor;
    const model = editor.model;
    const sel = model.document.selection;
    const selectedElement = sel.getSelectedElement();
    
    if (selectedElement && (selectedElement.name === 'imageBlock' || selectedElement.name === 'imageInline')) {
      model.change(writer => {
        writer.setAttribute('aspectRatio', ratio, selectedElement);
      });
    }
  }
}
