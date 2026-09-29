/**
 * 特殊标签词表与效果等级。词表沿用 UTags 的约定，设置页可增删（M2）。
 * 效果通过 CSS 属性选择器实现，见 styles/v2mark.css。
 */

export type SpecialTagEffect = 'opacity-10' | 'opacity-50' | 'hidden'

export const SPECIAL_TAG_TABLE: Record<string, SpecialTagEffect> = {
  // 半透明 10%
  sb: 'opacity-10',
  标题党: 'opacity-10',
  推广: 'opacity-10',
  无聊: 'opacity-10',
  忽略: 'opacity-10',
  ignore: 'opacity-10',
  clickbait: 'opacity-10',
  // 半透明 50%
  已阅: 'opacity-50',
  新用户: 'opacity-50',
  // 不显示
  block: 'hidden',
  hide: 'hidden',
  屏蔽: 'hidden',
  隐藏: 'hidden',
}

export function effectOfTag(tag: string): SpecialTagEffect | undefined {
  return SPECIAL_TAG_TABLE[tag]
}
