Django CKEditor 5 - Development Guide
========================================

Local Development
-----------------

1. **Clone and setup:**
   ::
   
      git clone https://github.com/liqd/django-ckeditor-5.git
      cd django-ckeditor-5
      python3 -m venv venv

2. **Build bundle:**
   ::
   
      cd django_ckeditor_5/static/django_ckeditor_5
      npm install
      npm run prod


3. **Create .whl package:**
   ::   
      ./venv/bin/pip install build
      ./venv/bin/python -m build

4. **Package location:**
   ::
   
      dist/django_ckeditor_5-0.2.14-py3-none-any.whl

5. **Local development with npm link (for a4-meinberlin):**
   ::
   
      # In django-ckeditor-5/django_ckeditor_5:
      sudo npm link
      
      # In a4-meinberlin:
      npm link django_ckeditor_5
      
      # After making changes to JavaScript/CSS, rebuild:
      cd django-ckeditor-5/django_ckeditor_5
      npm run dev

Notes
-----

- Commit the whl file only for for development purposes if really needed. 
