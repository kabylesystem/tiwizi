"""TTS d'UN mot/texte kabyle (MMS) → mp3. Usage: tts-one.py TEXTE SORTIE.mp3"""
import subprocess, sys, tempfile, os
import scipy.io.wavfile as wav
import torch
from transformers import AutoTokenizer, VitsModel

text, out = sys.argv[1], sys.argv[2]
model = VitsModel.from_pretrained("facebook/mms-tts-kab")
tok = AutoTokenizer.from_pretrained("facebook/mms-tts-kab")
with torch.no_grad():
    w = model(**tok(text, return_tensors="pt")).waveform
with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
    wav.write(f.name, rate=model.config.sampling_rate, data=w.squeeze().numpy())
    tmp = f.name
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-b:a", "48k", out], check=True)
os.unlink(tmp)
print(out)
