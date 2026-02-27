"""
Startup seeder — scans policies/ directory, embeds all PDFs into Supabase pgvector.
Skips PDFs that are already embedded (checks by filename).
Runs automatically on FastAPI startup via lifespan.
"""
import sys
import os
import glob

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services import pdf_parser, embedder, vector_store

# Root policies folder (relative to project root)
POLICIES_DIR = os.getenv(
    "POLICIES_DIR",
    os.path.join(os.path.dirname(__file__), "../../policies"),
)


def seed_all_policies():
    pdf_paths = glob.glob(os.path.join(POLICIES_DIR, "**/*.pdf"), recursive=True)
    if not pdf_paths:
        print(f"[Seeder] No PDFs found in {POLICIES_DIR}")
        return

    print(f"[Seeder] Found {len(pdf_paths)} PDFs in {POLICIES_DIR}")
    embedded = 0
    skipped = 0

    for pdf_path in pdf_paths:
        filename = os.path.basename(pdf_path)
        insurer = os.path.basename(os.path.dirname(pdf_path))  # folder name = insurer slug

        if vector_store.policy_already_embedded(filename):
            print(f"  [SKIP] {filename} (already embedded)")
            skipped += 1
            continue

        print(f"  [EMBED] {filename} ({insurer})...")
        try:
            # Parse PDF into section-aware chunks
            chunks = pdf_parser.parse_pdf(pdf_path)
            if not chunks:
                print(f"    [WARN] No text extracted from {filename}")
                continue

            # Get policy name from PDF content
            policy_name = pdf_parser.extract_policy_name(pdf_path)

            # Register in uploaded_policies table
            policy_id = vector_store.create_uploaded_policy(
                name=policy_name,
                filename=filename,
                insurer=insurer,
            )

            # Batch embed all chunks
            texts = [c.content for c in chunks]
            embeddings = embedder.embed_batch(texts)

            # Prepare rows for insertion
            rows = [
                {
                    "content": chunks[i].content,
                    "embedding": embeddings[i],
                    "page_number": chunks[i].page_number,
                    "chunk_index": chunks[i].chunk_index,
                    "section_type": chunks[i].section_type,
                }
                for i in range(len(chunks))
            ]

            vector_store.insert_chunks(policy_id, rows)
            vector_store.update_chunk_count(policy_id, len(rows))

            print(f"    Done — {len(chunks)} chunks embedded")
            embedded += 1

        except Exception as e:
            print(f"    [ERROR] Failed to embed {filename}: {e}")

    print(f"\n[Seeder] Complete — {embedded} embedded, {skipped} skipped")


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
    seed_all_policies()
