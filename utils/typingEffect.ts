/**
 * 打字机效果函数
 * @param text 要显示的文本
 * @param speed 打字速度（毫秒/字符）
 * @param callback 每打一个字的回调函数
 * @returns 取消打字机效果的函数
 */
export function typingEffect(
  text: string,
  speed: number = 30,
  callback: (currentText: string, isComplete: boolean) => void
): () => void {
  let index = 0;
  let isCancelled = false;
  
  const type = () => {
    if (isCancelled) return;
    
    if (index < text.length) {
      const currentText = text.substring(0, index + 1);
      callback(currentText, false);
      index++;
      setTimeout(type, speed);
    } else {
      callback(text, true);
    }
  };
  
  type();
  
  // 返回取消函数
  return () => {
    isCancelled = true;
  };
}

/**
 * 带延迟的打字机效果
 * @param text 要显示的文本
 * @param speed 打字速度（毫秒/字符）
 * @param delay 开始前的延迟（毫秒）
 * @param callback 每打一个字的回调函数
 * @returns 取消打字机效果的函数
 */
export function delayedTypingEffect(
  text: string,
  speed: number = 30,
  delay: number = 500,
  callback: (currentText: string, isComplete: boolean) => void
): () => void {
  let cancelFunction: (() => void) | null = null;
  let isCancelled = false;
  
  const timeoutId = setTimeout(() => {
    if (isCancelled) return;
    cancelFunction = typingEffect(text, speed, callback);
  }, delay);
  
  return () => {
    isCancelled = true;
    clearTimeout(timeoutId);
    if (cancelFunction) {
      cancelFunction();
    }
  };
}