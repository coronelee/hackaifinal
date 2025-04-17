import React, { useEffect, useRef, useState } from 'react'
import '../styles/voicerecord.css';
import { PiMicrophoneThin } from "react-icons/pi";
import { IoCloseOutline } from "react-icons/io5";
import { CiEraser } from "react-icons/ci";
import { IoSend } from "react-icons/io5"; 
import { IoPencil } from "react-icons/io5";
export default function VoiceRecord() {
    const isListening = useRef(false);
    const recognition = useRef(null);
    const finalTranscript = useRef('');
    const output = useRef(null);
    const resultIndex = useRef(0); 
    const [text, setText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const textAreaRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    
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

            recognition.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
            };

            return () => {
                recognition.current?.stop();
            };
        }
    }, []);

    const toggleRecording = async () => {
        if (isRecording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    };

    const startRecording = async () => {
        try {
            finalTranscript.current = '';
            setText('');
            resultIndex.current = 0;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); 
            setIsRecording(true);
            
            if (recognition.current) {
                recognition.current.start();
                isListening.current = true;
            }

            const wrapper = document.getElementById('wrapper');
            wrapper.style.boxShadow = '0px 0px 10px 10px rgba(0, 255, 0, 0.15)';
        } catch (err) {
            console.error("Ошибка записи:", err);
        }
    };

    const stopRecording = async () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }

        if (recognition.current) {
            recognition.current.stop();
            isListening.current = false;
        }

        const wrapper = document.getElementById('wrapper');
        wrapper.style.boxShadow = '0px 0px 10px 10px rgba(255, 0, 0, 0.15)';
    };

    const sendDataToServer = async () => {
        if (!text.trim() && audioChunksRef.current.length === 0) return;

        try {
            const formData = new FormData();
            
            formData.append('text', text);
            
            if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                formData.append('audio', audioBlob, 'recording.wav');
            }

            const response = await fetch('servak', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Ошибка при отправке данных');
            }

            const result = await response.json();
            console.log('Данные успешно отправлены:', result);
            alert('Данные успешно отправлены на сервер!');
            
            setText('');
            finalTranscript.current = '';
            audioChunksRef.current = [];
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при отправке данных');
        }
    };

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
    };

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
    };

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        if (!isEditing && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    return (
        <div className='wrapper' id='wrapper'>
            <div className='textIRLWrapper' id='textIRLWrapper'>
                <div className='bar'>
                    <CiEraser onClick={() => setText('')} title="Очистить текст"/>
                    <IoPencil 
                        onClick={toggleEditMode} 
                        className="edit-button"
                        title={isEditing ? "Завершить редактирование" : "Редактировать текст"}
                    />
                    <IoSend 
                        onClick={sendDataToServer} 
                        className="send-button"
                        title="Отправить данные"
                        disabled={!text && audioChunksRef.current.length === 0}
                    />
                    <IoCloseOutline onClick={() => removeKeyFrames()} id='close' title="Закрыть"/>
                </div>
                {isEditing ? (
                    <textarea
                        ref={textAreaRef}
                        className='textIRL-edit'
                        value={text}
                        onChange={handleTextChange}
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                    />
                ) : (
                    <div className='textIRL' id='textIRL' onClick={toggleEditMode}>
                        {text || <span className="placeholder">Нажмите для редактирования...</span>}
                    </div>
                )}
            </div>
            <PiMicrophoneThin 
                id='svg' 
                onClick={() => {
                    if (!isRecording) {
                        addKeyFrames();
                    }
                    toggleRecording();
                }} 
                title={isRecording ? "Остановить запись" : "Начать запись"}
                
            />
        </div>
    );
}