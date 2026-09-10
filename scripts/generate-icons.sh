#!/bin/bash

# PWA Icon Generator Script
#
# Moved out of public/icons/ in US-183. Everything under public/ is copied
# verbatim into dist/ and deployed, so this script was fetchable at
# https://agentbio.net/icons/generate-icons.sh and crawlable from there. It is
# a build tool, not part of the site.
#
# Run from the repository root.
# This script generates all required PWA icons from the source Icon.png file
# Requires ImageMagick or similar image conversion tool

SOURCE_IMAGE="public/Icon.png"
SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons from $SOURCE_IMAGE..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick not found. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image $SOURCE_IMAGE not found!"
    exit 1
fi

# Generate icons
for size in "${SIZES[@]}"; do
    output_file="icon-${size}.png"
    echo "Generating ${output_file} (${size}x${size})..."
    convert "$SOURCE_IMAGE" -resize "${size}x${size}" -background none -gravity center -extent "${size}x${size}" "$output_file"

    if [ $? -eq 0 ]; then
        echo "✓ Created ${output_file}"
    else
        echo "✗ Failed to create ${output_file}"
    fi
done

echo ""
echo "✓ All PWA icons generated successfully!"
echo "Icons created: ${SIZES[@]/#/icon-}"
echo "Icons created: ${SIZES[@]/%/.png}"
