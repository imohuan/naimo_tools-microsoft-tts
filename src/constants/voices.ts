import type { VoiceOptionsMap } from '../typings';

/**
 * 语音选项映射表
 */
export const VOICE_OPTIONS: VoiceOptionsMap = {
  'zh-CN': [
    { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓（女声）' },
    { value: 'zh-CN-YunxiNeural', label: '云希（男声）' },
    { value: 'zh-CN-YunyangNeural', label: '云扬（男声）' },
    { value: 'zh-CN-XiaoyiNeural', label: '晓伊（女声）' },
  ],
  'zh-TW': [
    { value: 'zh-TW-HsiaoChenNeural', label: '晓辰（女声）' },
    { value: 'zh-TW-YunJheNeural', label: '云哲（男声）' },
  ],
  'en-US': [
    { value: 'en-US-AriaNeural', label: 'Aria (Female)' },
    { value: 'en-US-GuyNeural', label: 'Guy (Male)' },
    { value: 'en-US-JennyNeural', label: 'Jenny (Female)' },
  ],
  'en-GB': [
    { value: 'en-GB-SoniaNeural', label: 'Sonia (Female)' },
    { value: 'en-GB-RyanNeural', label: 'Ryan (Male)' },
  ],
  'ja-JP': [
    { value: 'ja-JP-NanamiNeural', label: 'Nanami (Female)' },
    { value: 'ja-JP-KeitaNeural', label: 'Keita (Male)' },
  ],
  'ko-KR': [
    { value: 'ko-KR-SunHiNeural', label: 'SunHi (Female)' },
    { value: 'ko-KR-InJoonNeural', label: 'InJoon (Male)' },
  ],
  'fr-FR': [
    { value: 'fr-FR-DeniseNeural', label: 'Denise (Female)' },
    { value: 'fr-FR-HenriNeural', label: 'Henri (Male)' },
  ],
  'de-DE': [
    { value: 'de-DE-KatjaNeural', label: 'Katja (Female)' },
    { value: 'de-DE-ConradNeural', label: 'Conrad (Male)' },
  ],
  'es-ES': [
    { value: 'es-ES-ElviraNeural', label: 'Elvira (Female)' },
    { value: 'es-ES-AlvaroNeural', label: 'Alvaro (Male)' },
  ],
};

