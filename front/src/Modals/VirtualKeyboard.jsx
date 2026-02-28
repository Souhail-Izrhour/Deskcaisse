// Modals/VirtualKeyboard.jsx
import React, { useRef, useEffect } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { FiX } from "react-icons/fi";

function VirtualKeyboard({ inputName, inputValue, onChange, onKeyPress, onHide }) {
  const keyboard = useRef();

  useEffect(() => {
    if (keyboard.current && inputValue !== undefined) {
      keyboard.current.setInput(inputValue);
    }
  }, [inputValue, inputName]);

  const handleChange = (input) => {
    onChange(input);
  };

  const handleKeyPress = (button) => {
    onKeyPress(button);
  };

  return (
    <div className="virtual-keyboard-container relative">
      {/* En-tête du clavier avec bouton masquer */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
        <div className="text-sm text-gray-600">Clavier virtuel</div>
        <button
          onClick={onHide}
          className="text-gray-400 hover:text-gray-600 transition duration-150 flex items-center text-sm"
          title="Masquer le clavier"
        >
          <FiX className="w-4 h-4 mr-1" />
          Masquer
        </button>
      </div>
      
      <Keyboard
        keyboardRef={(r) => (keyboard.current = r)}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        inputName={inputName}
        layoutName="default"
        layout={{
          default: [
            "1 2 3 4 5 6 7 8 9 0 .",
            "q w e r t y u i o p",
            "a s d f g h j k l",
            "z x c v b n m @",
             "@metropole.com",
            "{space} {bksp} .com",
          ],
        }}
        display={{
          "{bksp}": "⌫",
          "{space}": "Espace",
        }}
        theme={"hg-theme-default hg-layout-default"}
        physicalKeyboardHighlight={false}
      />
    </div>
  );
}

export default VirtualKeyboard;