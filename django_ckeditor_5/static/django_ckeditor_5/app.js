import ClassicEditor from './src/ckeditor';
import './src/override-django.css';


let editors = [];

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function setSpecialConfigValues(config, csrf_cookie_name, upload_url, upload_file_types) {
    config.simpleUpload = {
        'uploadUrl': upload_url,
        'headers': {
            'X-CSRFToken': getCookie(csrf_cookie_name),
        },
    };

    config.fileUploader = {
        'fileTypes': upload_file_types
    };

    // overwrite embed providers to add rel=0 to youtube videos
    // this limits videos to youtube and vimeo
    if(config.mediaEmbed) {
        config.mediaEmbed.providers = [
            {
                name: 'youtube',
                url: [
                        /^(?:m\.)?youtube(?:-nocookie)?\.com\/watch\?v=([\w-]+)(?:&t=(\d+))?/,
                        /^(?:m\.)?youtube(?:-nocookie)?\.com\/v\/([\w-]+)(?:\?t=(\d+))?/,
                        /^youtube(?:-nocookie)?\.com\/embed\/([\w-]+)(?:\?start=(\d+))?/,
                        /^youtu\.be\/([\w-]+)(?:\?t=(\d+))?/
                ],
                html: match => {
                    const id = match[ 1 ];
                    const time = match[ 2 ];

                    return (
                        '<div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;">' +
                                `<iframe src="https://www.youtube-nocookie.com/embed/${ id }?rel=0${ time ? `&start=${ time }` : '' }" ` +
                                        'style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" ' +
                                        'frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>' +
                                '</iframe>' +
                        '</div>'
                    );
                }
            },
            {
                name: 'vimeo',
                url: [
                        /^vimeo\.com\/(\d+)/,
                        /^vimeo\.com\/[^/]+\/[^/]+\/video\/(\d+)/,
                        /^vimeo\.com\/album\/[^/]+\/video\/(\d+)/,
                        /^vimeo\.com\/channels\/[^/]+\/(\d+)/,
                        /^vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/,
                        /^vimeo\.com\/ondemand\/[^/]+\/(\d+)/,
                        /^player\.vimeo\.com\/video\/(\d+)/
                ],
                html: match => {
                        const id = match[ 1 ];

                        return (
                                '<div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;">' +
                                        `<iframe src="https://player.vimeo.com/video/${ id }" ` +
                                                'style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" ' +
                                                'frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen>' +
                                        '</iframe>' +
                                '</div>'
                        );
                }
            },
        ];
    }
}

function createEditors() {
    const allEditors = document.querySelectorAll('.django_ckeditor_5');
    for (let i = 0; i < allEditors.length; ++i) {
        if (
            allEditors[i].id.indexOf('__prefix__') !== -1 ||
            allEditors[i].getAttribute('data-processed') === '1'
        ) {
            continue;
        }
        const script_id = `${allEditors[i].id}_script`;
        allEditors[i].nextSibling.remove();
        const upload_url = document.getElementById(
            `${script_id}-ck-editor-5-upload-url`
        ).getAttribute('data-upload-url');
        const upload_file_types = JSON.parse(document.getElementById(
            `${script_id}-ck-editor-5-upload-url`
        ).getAttribute('data-upload-file-types'));
        const csrf_cookie_name = document.getElementById(
            `${script_id}-ck-editor-5-upload-url`
        ).getAttribute('data-csrf_cookie_name');
        const labelElement = document.querySelector(`[for$="${allEditors[i].id}"]`);
        if (labelElement) {
            labelElement.style.float = 'none';
        }

        const config = JSON.parse(
            document.getElementById(`${script_id}-span`).textContent,
            (key, value) => {
                var match = value.toString().match(new RegExp('^/(.*?)/([gimy]*)$'));
                if (match) {
                   var regex = new RegExp(match[1], match[2]);
                   return regex;
                }
                return value;
            }
        );

        setSpecialConfigValues(config, csrf_cookie_name, upload_url, upload_file_types)

        ClassicEditor.create(
            allEditors[i],
            config
        ).then(editor => {
            if (editor.plugins.has('WordCount')) {
                const wordCountPlugin = editor.plugins.get('WordCount');
                const wordCountWrapper = document.getElementById(`${script_id}-word-count`);
                wordCountWrapper.innerHTML = '';
                wordCountWrapper.appendChild(wordCountPlugin.wordCountContainer);
            }
            editors.push(editor);
        }).catch(error => {
            console.error((error));
        });
        allEditors[i].setAttribute('data-processed', '1');
    }
    window.editors = editors;
    window.ckeditorSetSpecialConfigValues = setSpecialConfigValues;
    window.ClassicEditor = ClassicEditor;
}

document.addEventListener("DOMContentLoaded", () => {
    createEditors();
    window.createEditors = createEditors;
    if (typeof django === "object" && django.jQuery) {
        django.jQuery(document).on("formset:added", createEditors);
    }
});

