#!/bin/bash

# Download sitemap (adjust if it's sitemap_index.xml instead)
curl -s https://iimskills.com/sitemap.xml -o sitemap.xml

# Extract URLs from XML
urls=$(grep -oP '(?<=<loc>).*?(?=</loc>)' sitemap.xml)

# Print table header
printf "%-80s | %s\n" "URL" "STATUS"
printf "%-80s-+-%s\n" "$(printf '%.0s-' {1..80})" "------"

# Check each URL
for url in $urls; do
    status=$(curl -o /dev/null -s -w "%{http_code}" "$url")
    if [ "$status" -eq 200 ]; then
        printf "%-80s | WORKING\n" "$url"
    else
        printf "%-80s | BROKEN ($status)\n" "$url"
    fi
done
