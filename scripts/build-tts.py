"""TTS kabyle (Meta MMS, facebook/mms-tts-kab) pour les phrases du corpus SANS
audio natif (jumeaux de transformation en tête). Sortie : public/tts/<id>.mp3.
Le texte reste 100% corpus humain ; seule la VOIX est synthétique, et l'UI
l'affiche comme telle (bouton azur + tooltip). Approuvé à l'écoute par naly
le 2026-07-14. Lancer : uv run --with transformers --with torch --with scipy \
  python scripts/build-tts.py
"""
import json
import os
import subprocess
import tempfile

import scipy.io.wavfile as wav
import torch
from transformers import AutoTokenizer, VitsModel

OUT = "public/tts"
os.makedirs(OUT, exist_ok=True)

d = json.load(open("data/patterns.json"))
targets: dict[int, str] = {}
for p in d["patterns"]:
    for t in p["twins"]:
        for side in (t["plain"], t["marked"]):
            if not side["audio"]:
                targets[side["id"]] = side["kab"]
    for arr in (p["flood"], p["probes"], p["extra"], p.get("foils", [])):
        for x in arr:
            if not x["audio"]:
                targets[x["id"]] = x["kab"]

todo = {i: t for i, t in targets.items() if not os.path.exists(f"{OUT}/{i}.mp3")}
print(f"{len(targets)} phrases sans audio natif, {len(todo)} à générer")
if not todo:
    raise SystemExit(0)

model = VitsModel.from_pretrained("facebook/mms-tts-kab")
tok = AutoTokenizer.from_pretrained("facebook/mms-tts-kab")
model.eval()

done = 0
for sid, text in todo.items():
    inputs = tok(text, return_tensors="pt")
    with torch.no_grad():
        waveform = model(**inputs).waveform
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        wav.write(f.name, rate=model.config.sampling_rate, data=waveform.squeeze().numpy())
        tmp = f.name
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-b:a", "48k", f"{OUT}/{sid}.mp3"],
        check=True,
    )
    os.unlink(tmp)
    done += 1
    if done % 100 == 0:
        print(f"{done}/{len(todo)}")

print(f"terminé : {done} mp3 dans {OUT}/")
