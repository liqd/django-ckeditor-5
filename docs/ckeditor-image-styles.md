# CKEditor Image Styling Options

## Overview

The CKEditor system has been extended with two predefined image styling options that automatically conform to styleguide requirements:

## Available Options

### Option 1: 4:3 Image Container

**Usage:**
- Use the **"4:3"** button for a 50% wide container (right-aligned)

**Properties:**
- The image is placed in a fixed 4:3 container
- Text flows around the image
- H2 headings start at the top edge of the image
- If the image ratio differs, the image is centered or cropped to fill the container

### Option 2: 2:1 Image Container (100% Content Width)

**Usage:**
- Use the **"2:1"** button for a full-width 2:1 container

**Properties:**
- The image is forced into a 2:1 container that spans the full content width
- H2 headings remain above the image
- Text continues below the image
- If the original ratio differs, the image is centered or cropped

## User Guide

1. **Upload Image:** Use the image upload function or insert an image via copy & paste
2. **Select Image:** Click on the uploaded image to select it
3. **Apply Styling:** Choose one of the available image styling options from the toolbar:
   - **4:3** (4:3 container, 50% width, right-aligned)
   - **2:1** (2:1 container, 100% width)

## Integration Guide

### Adding Aspect Ratio Buttons to CKEditor

Add the buttons to your CKEditor toolbar configuration in Django settings:

```python
CKEDITOR_5_CONFIGS = {
    "image-editor": {
        "image": {
            "toolbar": [
                "imageAspectRatio43",  # Add this
                "imageAspectRatio21",   # Add this
            ],
        },
    },
}
```
