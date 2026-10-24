# 端末内の写真検出に使うコンポーネント

- Tesseract.js 6.0.1 / tesseract.js-core 6.1.2: Apache-2.0。https://github.com/naptha/tesseract.js
- Tesseract言語データ（jpn / eng）: https://github.com/naptha/tessdata / Apache-2.0
- MediaPipe Tasks Vision 1.1.1: Apache-2.0。https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js
- BlazeFace short-range float16 model: https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite

public/demo/visionには実行用アセットを同梱しています。Tesseractのライセンスファイルも同梱しています。
これらは端末内の検出に使い、画像や検出結果を外部のAPIに送る処理はありません。
