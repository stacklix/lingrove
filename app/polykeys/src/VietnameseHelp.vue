<script setup lang="ts">
import { ref } from 'vue';
import { useAppI18n } from '@lingrove/host-sdk/vue';

const { t } = useAppI18n();
const dialog = ref<HTMLDialogElement>();
const letterExamples = [['aa', 'â'], ['aw', 'ă'], ['ee', 'ê'], ['oo', 'ô'], ['ow', 'ơ'], ['uw', 'ư'], ['dd', 'đ']];
const toneExamples = [['s', 'á'], ['f', 'à'], ['r', 'ả'], ['x', 'ã'], ['j', 'ạ']];
function open() { dialog.value?.showModal(); }
function close() { dialog.value?.close(); }
function backdrop(event: MouseEvent) { if (event.target === dialog.value) close(); }
defineExpose({ open });
</script>

<template>
  <dialog ref="dialog" class="input-help-sheet" aria-labelledby="input-help-title" @click="backdrop" @cancel.prevent="close">
    <header class="input-help-header">
      <h2 id="input-help-title">{{ t('越南语输入说明') }}</h2>
      <button class="lingrove-sheet-close" :aria-label="t('关闭输入说明')" autofocus @click="close">×</button>
    </header>
    <div class="input-help-content" tabindex="0" :aria-label="t('输入说明')">
      <h3>{{ t('长按选字') }}</h3>
      <p>{{ t('长按 a、e、i、o、u、y 或 d，滑到需要的字母后松开。字母按形状分行、声调分列，支持全部带声调字母。') }}</p>
      <p class="help-example" lang="vi">a → a á à ả ã ạ<br>ă → ă ắ ằ ẳ ẵ ặ<br>â → â ấ ầ ẩ ẫ ậ</p>
      <p>{{ t('使用 Shift 或大写锁定后，长按可选择大写字母。键盘导航时，在字母键按 ↓ 打开选字，用方向键选择、Enter 确认，Esc 取消。') }}</p>
      <h3>{{ t('Telex 组合输入') }}</h3>
      <p>{{ t('选择 Telex 后，直接用普通字母键组合。声调键可以在词末输入，空格或标点结束当前词。') }}</p>
      <div class="help-examples" :aria-label="t('特殊字母组合')"><span v-for="[input, result] in letterExamples" :key="input"><kbd>{{ input }}</kbd><span aria-hidden="true"> → </span><span lang="vi">{{ result }}</span></span></div>
      <p>{{ t('在元音后输入以下按键添加声调，例如 as → á；也可以组合使用，例如 aas → ấ。') }}</p>
      <div class="help-examples" :aria-label="t('声调组合')"><span v-for="[input, result] in toneExamples" :key="input"><kbd>{{ input }}</kbd><span aria-hidden="true"> → </span><span lang="vi">{{ result }}</span></span></div>
      <p class="help-example" lang="vi">tieengs vieetj → tiếng việt<br>ddawngj → đặng<br>nguowif → người</p>
      <h3>{{ t('修改与切换') }}</h3>
      <p>{{ t('z 去掉声调；重复修饰键可按原字母输入，例如 ass → as、aaa → aa。正在组合时，删除逐步撤销按键。') }}</p>
      <p>{{ t('输入英文时可切换到“长按选字”，字母就不会自动组合。切换输入方式或语言会保留文字和光标。') }}</p>
    </div>
  </dialog>
</template>
