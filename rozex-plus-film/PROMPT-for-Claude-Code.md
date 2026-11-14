Paste this into Claude Code, in a folder that contains this whole `rozex-plus-film/` folder:

---

Make a film with the Lemo-Opuscar library (https://github.com/lemomo-ai/lemo-opuscar) in the **Tablet Sketch Explainer** style (`styles/ipad-sketch`).

The brief is final and the treatment is already written: follow `rozex-plus-film/TREATMENT.md` exactly. Do not ask me more questions.

- Topic: Rozex Plus Cream (Dermavia), for the public in Iraq.
- 20 seconds, vertical 1080×1920, 24 fps.
- No voice-over and no subtitles. All words are handwritten pencil lettering on the page, in Iraqi Arabic, exactly as in the treatment's text table (section 4). Ingredient and product names stay in English.
- Arabic lettering: shape with HarfBuzz and lay out right-to-left before building stroke skeletons; write it right-to-left. Use Aref Ruqaa (OFL), fallback Reem Kufi Ink.
- `rozex-plus-film/ref/rozex-plus-pack.png` is my own product photo: use it only as a drawing reference for the tube; draw the tube in pencil.
- Keep all text out of the bottom 340 px and right 150 px (Instagram UI).
- Do not add any claim, percentage or word that is not in the treatment.
- Use the project folder `rozex-plus-film/`. Skip the storyboard approval; render, self-check (DIRECTOR.md §11) and deliver `rozex-plus.mp4`, `poster.jpg`, `CREDITS` and `build.sh`.
