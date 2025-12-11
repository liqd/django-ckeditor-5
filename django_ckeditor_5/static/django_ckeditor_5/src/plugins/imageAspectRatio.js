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

    editor.model.schema.extend('imageBlock', { allowAttributes: ['aspectRatio'] });
    editor.model.schema.extend('imageInline', { allowAttributes: ['aspectRatio'] });

    editor.conversion.for('downcast').add(dispatcher => {
      dispatcher.on('attribute:aspectRatio:imageBlock', (evt, data, api) => {
        const writer = api.writer;
        const figure = api.mapper.toViewElement(data.item);
        if (!figure) return;
        writer.removeClass(['image-aspect-ratio-43','image-aspect-ratio-21'], figure);
        if (data.attributeNewValue === '43') writer.addClass('image-aspect-ratio-43', figure);
        if (data.attributeNewValue === '21') writer.addClass('image-aspect-ratio-21', figure);
      });
      dispatcher.on('attribute:aspectRatio:imageInline', (evt, data, api) => {
        const writer = api.writer;
        const figure = api.mapper.toViewElement(data.item);
        if (!figure) return;
        writer.removeClass(['image-aspect-ratio-43','image-aspect-ratio-21'], figure);
        if (data.attributeNewValue === '43') writer.addClass('image-aspect-ratio-43', figure);
        if (data.attributeNewValue === '21') writer.addClass('image-aspect-ratio-21', figure);
      });
    });

    editor.conversion.for('upcast').elementToElement({
      view: { name: 'figure', classes: ['image','image-aspect-ratio-43'] },
      model: (el, { writer }) => writer.createElement('imageBlock', { aspectRatio: '43' })
    });
    editor.conversion.for('upcast').elementToElement({
      view: { name: 'figure', classes: ['image','image-aspect-ratio-21'] },
      model: (el, { writer }) => writer.createElement('imageBlock', { aspectRatio: '21' })
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
    model.change(writer => {
      for (const block of sel.getSelectedBlocks()) {
        if (block.name === 'imageBlock' || block.name === 'imageInline') {
          writer.setAttribute('aspectRatio', ratio, block);
        }
      }
    });
  }
}
