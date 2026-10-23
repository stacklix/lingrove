"""Package local human pronunciation recordings using FFmpeg (no network required)."""
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
parser.add_argument('--recordings-only', action='store_true', help='All current samples are human recordings')
parser.add_argument('--ffmpeg', default='ffmpeg', help='FFmpeg executable path')
args = parser.parse_args()
samples = json.loads((root / 'app/omniglyph/src/pronunciation-samples.json').read_text(encoding='utf-8'))
output = root / 'app/omniglyph/audio-generated'
output.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='omniglyph-speech-') as temporary:
    for sample in samples:
        raw = root / 'app/omniglyph/audio-sources' / sample['recording']
        wav = Path(temporary) / (sample['id'] + '.wav')
        command = [args.ffmpeg, '-v', 'error', '-y', '-i', str(raw)]
        if 'filter' in sample:
            command += ['-af', sample['filter']]
        if 'clip' in sample:
            start, end = sample['clip']
            if not 0 <= start < end:
                raise ValueError(f"Invalid clip bounds: {sample['id']}")
            command += ['-ss', str(start), '-t', str(end - start)]
        command += ['-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', str(wav)]
        subprocess.run(command, check=True)
        with wave.open(str(wav)) as audio:
            duration = audio.getnframes() / audio.getframerate()
            pcm = array.array('h', audio.readframes(audio.getnframes()))
            if not 0.1 < duration < 10 or not pcm or max(map(abs, pcm)) < 100:
                raise RuntimeError(f"Empty or silent audio: {sample['id']}")
        (output / wav.name).write_bytes(wav.read_bytes())
        print(f"{wav.name}: {duration:.2f}s")

encoded = {sample['id']: 'data:audio/wav;base64,' + base64.b64encode(
    (output / (sample['id'] + '.wav')).read_bytes()).decode('ascii') for sample in samples}
(root / 'app/omniglyph/src/pronunciation-audio.json').write_text(json.dumps(encoded, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(root / 'app/omniglyph/public/audio/SOURCES.json').write_bytes((root / 'app/omniglyph/src/pronunciation-sources.json').read_bytes())
