import os
from PIL import Image, ImageDraw, ImageFont

def main():
    # Use Windows system fonts
    serif_path = "C:/Windows/Fonts/georgiab.ttf"  # Georgia Bold
    sans_path = "C:/Windows/Fonts/segoeui.ttf"    # Segoe UI
    
    # Create transparent image
    # Size: 1000 x 250 (extremely crisp, high-resolution 4:1 ratio)
    width = 1000
    height = 250
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Draw leaf icon
    # Bounding box of icon: X: 50-180, Y: 40-210 (centered at X=115, Y=125)
    icon_color = (195, 217, 161, 255) # #C3D9A1 (theme primary)
    accent_color = (255, 255, 255, 255) # White
    
    # Center stem line of the leaf
    draw.line([(115, 45), (115, 205)], fill=icon_color, width=6)
    
    # Left side of the leaf: drawing multiple elegant sweeping curves for a stylized fenestrated leaf/aroid
    # Upper lobe
    draw.arc([(70, 50), (115, 120)], 180, 270, fill=icon_color, width=4)
    # Middle lobes
    draw.arc([(50, 80), (115, 150)], 180, 270, fill=icon_color, width=4)
    draw.arc([(40, 110), (115, 180)], 180, 270, fill=icon_color, width=4)
    # Lower tip curve
    draw.arc([(55, 140), (115, 200)], 180, 270, fill=icon_color, width=4)
    
    # Right side of the leaf (symmetrical)
    # Upper lobe
    draw.arc([(115, 50), (160, 120)], 270, 360, fill=icon_color, width=4)
    # Middle lobes
    draw.arc([(115, 80), (180, 150)], 270, 360, fill=icon_color, width=4)
    draw.arc([(115, 110), (190, 180)], 270, 360, fill=icon_color, width=4)
    # Lower tip curve
    draw.arc([(115, 140), (175, 200)], 270, 360, fill=icon_color, width=4)
    
    # Outer elegant leaf contour (connecting points)
    # Leaf tip at the bottom
    draw.line([(115, 205), (115, 210)], fill=icon_color, width=6)
    # Outer sweeping border
    draw.ellipse([(111, 41), (119, 49)], fill=accent_color)
    
    # Fonts
    serif_font_large = ImageFont.truetype(serif_path, 72)
    sans_font_small = ImageFont.truetype(sans_path, 20)
    
    # Draw Brand Text
    # "ARIOD ATLAS"
    # Draw in white
    draw.text((220, 60), "ARIOD ATLAS", fill=(255, 255, 255, 255), font=serif_font_large)
    
    # Draw Subtitle Text
    # "V I S U A L   E N C Y C L O P E D I A   O F   R A R E   P L A N T S"
    # Spaced letters for high-end luxury brand feel
    subtitle = "V I S U A L   E N C Y C L O P E D I A   O F   R A R E   A R O I D S"
    draw.text((225, 155), subtitle, fill=(139, 154, 146, 255), font=sans_font_small)
    
    # Save image to public/images/logo.png
    output_path = "public/images/logo.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    image.save(output_path, "PNG")
    print(f"Logo successfully generated and saved to {output_path}!")

if __name__ == "__main__":
    main()
