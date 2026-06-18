from PIL import Image

def main():
    img_path = r"c:\Users\nicho\OneDrive\Documents\Web Development\Ariod Atlas AG\AriodAtlas\public\images\logo.png"
    img = Image.open(img_path)
    
    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        print(f"Original size: {img.size}")
        print(f"Bounding box: {bbox}")
        cropped_img = img.crop(bbox)
        print(f"Cropped size: {cropped_img.size}")
        cropped_img.save(img_path)
        print("Logo cropped and saved successfully!")
    else:
        print("Error: Could not find bounding box (image might be completely transparent).")

if __name__ == "__main__":
    main()
