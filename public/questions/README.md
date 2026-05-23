# Question images

Put image files here (JPG, PNG, WebP, GIF).

In `src/data/questions.json`, reference them by filename:

```json
{
  "text": "Who is this?",
  "answer": "Andy",
  "points": 100,
  "image": "andy-photo.jpg"
}
```

Or use a full path: `"image": "/questions/andy-photo.jpg"`

Images appear on the **display** when the answer is revealed (correct or queue exhausted).
