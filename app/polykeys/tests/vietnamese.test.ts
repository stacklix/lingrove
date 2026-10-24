import { describe, expect, it } from 'vitest';
import { composeVietnamese, vietnameseVariants } from '../src/vietnamese';

describe('Vietnamese Telex composition', () => {
  it.each([
    ['aa', 'â'], ['aw', 'ă'], ['ee', 'ê'], ['oo', 'ô'], ['ow', 'ơ'], ['uw', 'ư'], ['dd', 'đ'],
    ['as', 'á'], ['af', 'à'], ['ar', 'ả'], ['ax', 'ã'], ['aj', 'ạ'], ['aas', 'ấ'], ['asw', 'ắ'],
    ['owf', 'ờ'], ['ofw', 'ờ'], ['tieengs', 'tiếng'], ['vieetj', 'việt'], ['ddawngj', 'đặng'],
    ['nguowif', 'người'], ['tuowng', 'tương'], ['quyeens', 'quyến'], ['quoocs', 'quốc'],
    ['gias', 'giá'], ['gif', 'gì'], ['nguyeenx', 'nguyễn'], ['hoaf', 'hoà'], ['hoanf', 'hoàn'],
    ['khoer', 'khoẻ'], ['thuyr', 'thuỷ'], ['tieeus', 'tiếu'], ['DDawngj', 'Đặng'], ['TIEENGS', 'TIẾNG'],
    ['chaof', 'chào'], ['tooi', 'tôi'], ['yeeu', 'yêu'], ['hocj', 'học'], ['truowngf', 'trường'],
    ['dduowcj', 'được'], ['huuwx', 'hữu'], ['ruouwj', 'rượu'], ['muaw', 'mưa'], ['nguoiwf', 'người'],
    ['giuwowngf', 'giường'], ['khuyur', 'khuỷu'], ['quawng', 'quăng'],
    ['asz', 'a'], ['ass', 'as'], ['aaa', 'aa'], ['ddd', 'dd'], ['uww', 'uw'], ['w', 'ư'], ['ww', 'w'], ['s', 's'], ['z', 'z'],
  ])('composes %s as %s', (input, expected) => {
    expect(composeVietnamese(input)).toBe(expected);
  });
  it('replays partial input so deletion can undo every modifier', () => {
    expect(['tieengs', 'tieeng', 'tieen', 'tiee', 'tie', 'ti', 't', ''].map(composeVietnamese))
      .toEqual(['tiếng', 'tiêng', 'tiên', 'tiê', 'tie', 'ti', 't', '']);
    expect(composeVietnamese('asf')).toBe('à');
  });
  it('offers every upper- and lowercase vowel with all tones without duplicates', () => {
    for (const key of 'aeiouyd') {
      const variants = vietnameseVariants(key);
      expect(new Set(variants).size).toBe(variants.length);
      expect(vietnameseVariants(key.toUpperCase())).toEqual(variants.map(char => char.toLocaleUpperCase('vi')));
    }
    const variants = [...'aeiouy'].flatMap(vietnameseVariants);
    expect(variants).toHaveLength(72);
    for (const base of 'aăâeêioôơuưy') {
      for (const tone of ['', '\u0301', '\u0300', '\u0309', '\u0303', '\u0323']) {
        expect(variants).toContain((base + tone).normalize('NFC'));
      }
    }
    expect(vietnameseVariants('d')).toEqual(['d', 'đ']);
    expect(vietnameseVariants('b')).toEqual([]);
  });
});
