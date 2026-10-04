"""Package local human recordings and macOS speech samples without network access."""
import argparse
import array
import base64
import json
from pathlib import Path
import subprocess
import tempfile
import wave

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--recordings-only', action='store_true', help='Keep existing synthesized WAV files')
args = parser.parse_args()
samples = json.loads((root / 'glyphora/src/pronunciation-samples.json').read_text())
output = root / 'glyphora/public/audio'
output.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='glyphora-speech-') as temporary:
    for sample in samples:
        if args.recordings_only and 'recording' not in sample:
            continue
        wav = Path(temporary) / (sample['id'] + '.wav')
        if 'recording' in sample:
            raw = root / 'glyphora/audio-sources' / sample['recording']
        else:
            raw = Path(temporary) / (sample['id'] + '.aiff')
            subprocess.run(['say', '-v', sample['voice'], '-r', str(sample['rate']), '-o', str(raw), sample['text']], check=True)
        subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@24000', '-c', '1', str(raw), str(wav)], check=True)
        if 'clip' in sample:
            with wave.open(str(wav)) as audio:
                params = audio.getparams()
                start, end = sample['clip']
                if not 0 <= start < end <= audio.getnframes() / audio.getframerate():
                    raise ValueError(f"Invalid clip bounds: {sample['id']}")
                audio.setpos(round(start * audio.getframerate()))
                frames = audio.readframes(round((end - start) * audio.getframerate()))
            with wave.open(str(wav), 'wb') as audio:
                audio.setparams(params)
                audio.writeframes(frames)
        with wave.open(str(wav)) as audio:
            duration = audio.getnframes() / audio.getframerate()
            pcm = array.array('h', audio.readframes(audio.getnframes()))
            if not 0.1 < duration < 10 or not pcm or max(map(abs, pcm)) < 100:
                raise RuntimeError(f"Empty or silent audio: {sample['id']}")
        (output / wav.name).write_bytes(wav.read_bytes())
        print(f"{wav.name}: {duration:.2f}s")

encoded = {sample['id']: 'data:audio/wav;base64,' + base64.b64encode(
    (output / (sample['id'] + '.wav')).read_bytes()).decode('ascii') for sample in samples}
(root / 'glyphora/src/pronunciation-audio.json').write_text(json.dumps(encoded, indent=2) + '\n')
(output / 'SOURCES.json').write_bytes((root / 'glyphora/src/pronunciation-sources.json').read_bytes())
