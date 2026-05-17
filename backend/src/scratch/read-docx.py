import zipfile
import xml.etree.ElementTree as ET
import os

def get_docx_text(path):
    if not os.path.exists(path):
        return f"Error: File not found at {path}"
    try:
        with zipfile.ZipFile(path) as doc:
            xml_content = doc.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            paragraphs = []
            for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = []
                for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if t.text:
                        texts.append(t.text)
                if texts:
                    paragraphs.append("".join(texts))
            return "\n".join(paragraphs)
    except Exception as e:
        return f"Error parsing DOCX: {e}"

if __name__ == "__main__":
    docx_path = r"c:\Users\INS 3515\OneDrive\Desktop\Atomquest\AtomQuest_Design_System.docx"
    output_path = r"c:\Users\INS 3515\OneDrive\Desktop\Atomquest\backend\src\scratch\design_system.txt"
    
    text = get_docx_text(docx_path)
    
    # Save the output as UTF-8 file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)
        
    print(f"Extracted DOCX text successfully to {output_path}")
