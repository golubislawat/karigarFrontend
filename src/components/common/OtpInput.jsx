import { useRef, useEffect } from 'react';

export default function OtpInput({ value = '', onChange, onComplete, disabled = false }) {
  const inputsRef = useRef([]);

  const digits = (value + '      ').slice(0, 6).split('');

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const newArr = value.split('');
    while (newArr.length < 6) newArr.push('');
    newArr[index] = char;
    const newVal = newArr.join('').slice(0, 6);
    onChange(newVal);

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newVal.replace(/[^0-9]/g, '').length === 6 && onComplete) {
      onComplete(newVal);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, 5);
      inputsRef.current[nextIdx]?.focus();
      if (pasted.length === 6 && onComplete) {
        onComplete(pasted);
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 max-w-sm mx-auto my-4" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          disabled={disabled}
          className="w-12 h-14 md:w-14 md:h-16 text-center text-[22px] font-black rounded-2xl bg-bg border-2 border-rule focus:border-accent2 focus:bg-white text-ink outline-none transition-all shadow-inner-soft"
        />
      ))}
    </div>
  );
}
