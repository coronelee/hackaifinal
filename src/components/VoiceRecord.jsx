import React, { useEffect, useRef, useState } from 'react'
import '../styles/voicerecord.css';
import { PiMicrophoneThin } from "react-icons/pi";
import { IoCloseOutline } from "react-icons/io5";
import { CiEraser } from "react-icons/ci";
export default function VoiceRecord() {
    const isListening = useRef(false);
    const recognition = useRef(null);
    const finalTranscript = useRef('');
    const output = useRef(null);
    const resultIndex = useRef(0); 
    const [text, setText] = useState('');
    useEffect(() => {
        const wrapper = document.getElementById('wrapper');
        const svg = document.getElementById('svg');
        const close = document.getElementById('close');
        output.current = document.getElementById('textIRL');

        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition.current = new SpeechRecognition();
            
            recognition.current.continuous = true; 
            recognition.current.lang = 'ru-RU';

            const handleClick = () => {
                if (isListening.current) {
                    recognition.current.stop();
                    finalTranscript.current = '';
                    resultIndex.current = 0;
                    wrapper.style.boxShadow = '0px 0px 10px 10px rgba(255, 0, 0, 0.15)';

                } else {
                    recognition.current.start();
                    wrapper.style.boxShadow = '0px 0px 10px 10px rgba(0, 255, 0, 0.15)';
                }
                isListening.current = !isListening.current;
            };
            svg.addEventListener('click', handleClick);
            close.addEventListener('click', handleClick);

            
            recognition.current.onresult = (event) => {
                let interim = ''; 
                for (let i = resultIndex.current; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript.current += result[0].transcript + ' ';
                    } else {
                        interim = result[0].transcript;
                    }
                }
                resultIndex.current = event.results.length;
                
                setText(finalTranscript.current + interim);
            };

            return () => {
                close.removeEventListener('click', handleClick);
                svg.removeEventListener('click', handleClick);
                recognition.current?.stop();
            };
        }
    }, []);

    const addKeyFrames = () => {
        const wrapper = document.getElementById('wrapper');
        const svg = document.getElementById('svg');
        const textIRLWrapper = document.getElementById('textIRLWrapper');
        wrapper.classList.remove('animateClose');

        wrapper.classList.add('animate');
        svg.classList.add('animate');
        setTimeout(() => {
            wrapper.style.height = '500px';
        }, 1000);
        setTimeout(() => {
            textIRLWrapper.style.display = 'flex';
        }, 1400);
    }

    const removeKeyFrames = () => {
        const wrapper = document.getElementById('wrapper');
        const svg = document.getElementById('svg');
        const textIRLWrapper = document.getElementById('textIRLWrapper');
        wrapper.classList.remove('animate');
        svg.classList.remove('animate');
        wrapper.classList.add('animateClose');
        textIRLWrapper.style.display = 'none';
        wrapper.style.height = '50px';
        wrapper.style.boxShadow = '0px 0px 10px 10px rgba(255, 0, 0, 0.15)';
    }

    return (
        <div className='wrapper'  id='wrapper'>
            <div className='textIRLWrapper' id='textIRLWrapper'>
                <div className='bar'><CiEraser onClick={() => setText('')}/><IoCloseOutline onClick={() => removeKeyFrames()} id='close'/></div>
                <span className='textIRL' id='textIRL'>{text}</span>
                {/* <div className='line'></div> */}
            </div>
            <PiMicrophoneThin id='svg' onClick={() => addKeyFrames()}/>
        </div>
    )
}