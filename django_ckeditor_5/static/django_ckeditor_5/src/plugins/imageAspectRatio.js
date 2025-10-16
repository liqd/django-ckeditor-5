import { Plugin } from '@ckeditor/ckeditor5-core/';
import { ButtonView } from '@ckeditor/ckeditor5-ui/';

export default class ImageAspectRatioPlugin extends Plugin {
  static get pluginName() { return 'ImageAspectRatio'; }

  init() {
    const editor = this.editor;

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

    editor.ui.componentFactory.add('imageAspectRatio43', locale => {
      const view = new ButtonView(locale);
      view.set({
        label: '4:3',
        tooltip: '4:3 Seitenverhältnis',
        withText: false,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" role="img" aria-label="4:3"><rect x="3" y="5" width="14" height="10" rx="1.5" ry="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="10" y="10" fill="currentColor" font-size="7" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, sans-serif">4:3</text></svg>'
      });
      view.on('execute', () => this.apply('43'));
      return view;
    });

    editor.ui.componentFactory.add('imageAspectRatio21', locale => {
      const view = new ButtonView(locale);
      view.set({
        label: '2:1',
        tooltip: '2:1 Seitenverhältnis',
        withText: false,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" role="img" aria-label="2:1"><rect x="2.5" y="6.5" width="15" height="7" rx="1.5" ry="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="10" y="10" fill="currentColor" font-size="7" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, sans-serif">2:1</text></svg>'
      });
      view.on('execute', () => this.apply('21'));
      return view;
    });
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
