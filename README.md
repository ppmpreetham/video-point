# Video Point

Better way to control your presentations
Add keyframes to your videos, and navigate through them with ease.

## Usage
Head over to the website:
video-point-chi.vercel.app

To use this, you need two clips:
1. The video you want to present
2. The reverse of the video you want to present
The reverse of the video can be made using ffmpeg:

```bash
ffmpeg -i input.mp4 -vf reverse reversed.mp4
```
## Future Features
- [ ] Make the keyframes draggable
- [ ] Make an export and import feature for keyframes
- [ ] Realtime keyframe editing