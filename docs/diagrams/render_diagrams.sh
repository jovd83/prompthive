#!/bin/bash
# This script renders Mermaid diagrams to PNG images.
# Requirement: npm install -g @mermaid-js/mermaid-cli

# Ensure output directory exists
mkdir -p docs/diagrams/img

# Metadata
VERSION="1.0.0"
CURRENT_DATE=$(date "+%Y-%m-%d %H:%M")

# Helper function to render with metadata
render_diagram() {
    INPUT_FILE=$1
    OUTPUT_FILE=$2
    PAGE_TITLE=$3
    
    TEMP_FILE="docs/diagrams/src/temp_render.mmd"

    # Create temporary file with Frontmatter Title
    echo "---" > "$TEMP_FILE"
    echo "title: $PAGE_TITLE | v$VERSION | $CURRENT_DATE" >> "$TEMP_FILE"
    echo "---" >> "$TEMP_FILE"
    cat "$INPUT_FILE" >> "$TEMP_FILE"

    # Render with High Quality (Scale 3) and White Background
    echo "Rendering $PAGE_TITLE..."
    npx @mermaid-js/mermaid-cli \
        -i "$TEMP_FILE" \
        -o "$OUTPUT_FILE" \
        --backgroundColor white \
        --scale 3
    
    # Cleanup
    rm "$TEMP_FILE"
}

# 1. Architecture Diagram
render_diagram "docs/diagrams/src/architecture.mmd" "docs/diagrams/img/architecture.png" "PromptHive Architecture"

# 2. Schema Diagram
render_diagram "docs/diagrams/src/schema.mmd" "docs/diagrams/img/schema.png" "PromptHive Data Schema"

# 3. Render all Wireframes
echo "Rendering Wireframes..."
for file in docs/wireframes/*.mmd; do
    filename=$(basename -- "$file")
    name="${filename%.*}"
    
    # Form title from filename (replace _ with space and title case)
    # Simple bash string replacement:
    title_clean=${name//_/ }
    title="Wireframe: $title_clean"
    
    render_diagram "$file" "docs/diagrams/img/$name.png" "$title"
done

echo "✅ All Diagrams and Wireframes rendered to docs/diagrams/img/."
