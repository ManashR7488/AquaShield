import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BsChatDotsFill } from "react-icons/bs";
import Markdown from "react-markdown";
import { 
  FiSend, 
  FiX, 
  FiMinus, 
  // LuBot, 
  FiUser, 
  FiHeart, 
  FiDroplet, 
  FiActivity,
  FiMapPin,
  FiClock,
  FiHelpCircle,
  FiMic,
  FiMicOff,
  FiVolume2,
  FiVolumeX
} from 'react-icons/fi';
import { LuBot } from "react-icons/lu";
import useAiStore from '../../store/useAiStore';

const ChatBot = () => {
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [recognition, setRecognition] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const messagesEndRef = useRef(null);
  const { messages, addMessage, generate, generateVoice, isLoading, clearMessages } = useAiStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsRecording(true);
        };
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsRecording(false);
          // Auto-send the voice message using voice-specific method
          setTimeout(async () => {
            if (transcript.trim()) {
              try {
                await generateVoice(transcript);
                setInputMessage(''); // Clear input after sending
              } catch (error) {
                console.error('Error sending voice message:', error);
              }
            }
          }, 100);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        setRecognition(recognition);
      } else {
        console.warn('Speech recognition not supported in this browser');
      }

      // Initialize Speech Synthesis
      if (window.speechSynthesis) {
        setSpeechSynthesis(window.speechSynthesis);
      } else {
        console.warn('Speech synthesis not supported in this browser');
      }
    }
  }, []);

  const handleSendMessage = async (messageText = null) => {
    const messageToSend = messageText || inputMessage;
    if (messageToSend.trim() && !isLoading) {
      setInputMessage('');
      
      try {
        await generate(messageToSend);
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message to chat
        addMessage({
          sender: 'bot',
          text: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now()
        });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice input functions - defined before useEffect that uses them
  const startVoiceInput = useCallback(() => {
    if (recognition && !isRecording && !isLoading) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
      }
    }
  }, [recognition, isRecording, isLoading]);

  const stopVoiceInput = useCallback(() => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  }, [recognition, isRecording]);

  // Text-to-speech function
  const speakText = useCallback((text) => {
    if (speechSynthesis && speechEnabled && text) {
      // Stop any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  }, [speechSynthesis, speechEnabled]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSynthesis, isSpeaking]);

  // Keyboard shortcuts for voice controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showChatWindow && !isMinimized) {
        // Press and hold Space for voice input (when not typing in textarea)
        if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && !isRecording && recognition) {
          e.preventDefault();
          startVoiceInput();
        }
        
        // Press Escape to stop recording or speaking
        if (e.key === 'Escape') {
          if (isRecording) stopVoiceInput();
          if (isSpeaking) stopSpeaking();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (showChatWindow && !isMinimized) {
        // Release Space to stop recording
        if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && isRecording) {
          e.preventDefault();
          stopVoiceInput();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showChatWindow, isMinimized, isRecording, isSpeaking, recognition, startVoiceInput, stopVoiceInput, stopSpeaking]);

  // Auto-speak bot responses
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot' && speechEnabled && !isLoading) {
        // Small delay to ensure message is rendered
        setTimeout(() => {
          speakText(lastMessage.text);
        }, 500);
      }
    }
  }, [messages, speakText, speechEnabled, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognition && isRecording) {
        recognition.stop();
      }
      if (speechSynthesis && isSpeaking) {
        speechSynthesis.cancel();
      }
    };
  }, [recognition, speechSynthesis, isRecording, isSpeaking]);

  const quickQuestions = [
    { icon: FiHeart, text: "What are the symptoms of dengue?" },
    { icon: FiDroplet, text: "How to test water quality?" },
    { icon: FiActivity, text: "Check vaccination schedule" },
    { icon: FiMapPin, text: "Find nearest health center" }
  ];

  return (
    <div className='fixed z-[1000] pointer-events-none h-screen w-screen'>
      {/* Chat Button */}
      <div className='absolute bottom-6 right-6 pointer-events-auto'>
        <button 
          onClick={() => setShowChatWindow(!showChatWindow)} 
          className='bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 border-2 border-white shadow-lg text-white p-4 rounded-full cursor-pointer transform transition-all duration-200 hover:scale-110 active:scale-95'
        >
          {showChatWindow ? <FiX size={24}/> : <BsChatDotsFill size={24}/>}
        </button>
        
        {/* Notification Badge */}
        {!showChatWindow && messages.length > 1 && (
          <div className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse'>
            {messages.length - 1}
          </div>
        )}
      </div>

      {/* Chat Window */}
      {showChatWindow && (
        <div className='fixed bottom-20 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 pointer-events-auto flex flex-col overflow-hidden transform transition-all duration-300 ease-in-out sm:w-96 xs:w-80'>
          
          {/* Chat Header */}
          <div className='bg-gradient-to-r from-teal-600 to-blue-600 p-4 text-white rounded-t-2xl'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center'>
                  <LuBot size={20} />
                </div>
                <div>
                  <h3 className='font-semibold text-lg'>AquaShield Assistant</h3>
                  <p className='text-sm opacity-90'>Health & Water Quality Support</p>
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                {/* Speech Toggle */}
                <button 
                  onClick={() => {
                    setSpeechEnabled(!speechEnabled);
                    if (!speechEnabled) {
                      stopSpeaking();
                    }
                  }}
                  className='p-1 hover:bg-white hover:bg-opacity-20 rounded'
                  title={speechEnabled ? 'Disable speech' : 'Enable speech'}
                >
                  {speechEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className='p-1 hover:bg-white hover:bg-opacity-20 rounded'
                >
                  <FiMinus size={16} />
                </button>
                <button 
                  onClick={() => setShowChatWindow(false)}
                  className='p-1 hover:bg-white hover:bg-opacity-20 rounded'
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50'>
                {messages.length <= 1 && (
                  <div className='text-center py-8'>
                    <div className='w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                      <LuBot className='text-teal-600' size={24} />
                    </div>
                    <h4 className='text-lg font-semibold text-gray-900 mb-2'>Welcome to AquaShield Assistant</h4>
                    <p className='text-gray-600 text-sm mb-6'>Ask me about health surveillance, water quality, or community health programs.</p>
                    
                    {/* Quick Questions */}
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-gray-700 mb-3'>Quick Questions:</p>
                      {quickQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={async () => {
                            if (!isLoading) {
                              try {
                                await generate(question.text);
                              } catch (error) {
                                console.error('Error sending quick question:', error);
                              }
                            }
                          }}
                          className='w-full flex items-center space-x-3 p-3 text-left bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors text-sm'
                        >
                          <question.icon className='text-teal-600' size={16} />
                          <span className='text-gray-700'>{question.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-2 max-w-xs ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-teal-500 text-white'
                      }`}>
                        {message.sender === 'user' ? <FiUser size={16} /> : <LuBot size={16} />}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`rounded-2xl px-4 py-2 max-w-xs break-words ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                      }`}>
                        {message.isVoice && message.sender === 'user' && (
                          <div className='flex items-center mb-1 opacity-75'>
                            <FiMic size={12} className='mr-1' />
                            <span className='text-xs'>Voice message</span>
                          </div>
                        )}
                        <div className='text-sm leading-relaxed'>
                          <Markdown>{message.text}</Markdown>
                        </div>
                        
                        {/* Play button for bot messages */}
                        {message.sender === 'bot' && speechSynthesis && (
                          <button
                            onClick={() => speakText(message.text)}
                            className='mt-1 text-xs opacity-60 hover:opacity-100 flex items-center'
                            title='Play this message'
                          >
                            <FiVolume2 size={10} className='mr-1' />
                            <span>Play</span>
                          </button>
                        )}
                        
                        {/* Timestamp */}
                        <div className={`flex items-center mt-1 ${
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`text-xs opacity-70 ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <FiClock size={10} className='inline mr-1' />
                            {message.timestamp 
                              ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className='flex justify-start'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center'>
                        <LuBot className='text-white' size={16} />
                      </div>
                      <div className='bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-200 shadow-sm'>
                        <div className='flex space-x-1'>
                          <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                          <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
                          <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Speaking Indicator */}
                {isSpeaking && (
                  <div className='flex justify-start'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse'>
                        <FiVolume2 className='text-white' size={16} />
                      </div>
                      <div className='bg-green-50 rounded-2xl rounded-tl-sm px-4 py-2 border border-green-200 shadow-sm'>
                        <p className='text-sm text-green-700 flex items-center'>
                          <span className='mr-2'>🔊</span>
                          Speaking...
                          <button
                            onClick={stopSpeaking}
                            className='ml-2 text-green-600 hover:text-green-800'
                          >
                            <FiX size={14} />
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className='flex justify-center'>
                    <div className='bg-red-50 rounded-2xl px-4 py-2 border border-red-200 shadow-sm'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                        <p className='text-sm text-red-700'>
                          🎤 Listening... Speak now
                        </p>
                        <button
                          onClick={stopVoiceInput}
                          className='text-red-600 hover:text-red-800'
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className='p-4 bg-white border-t border-gray-200'>
                <div className='flex items-end space-x-2'>
                  <div className='flex-1'>
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isRecording ? 'Listening...' : 'Ask about health surveillance, water quality, or emergency procedures...'}
                      className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-sm'
                      rows='2'
                      disabled={isLoading || isRecording}
                    />
                  </div>
                  
                  {/* Voice Input Button */}
                  {recognition && (
                    <button
                      onClick={isRecording ? stopVoiceInput : startVoiceInput}
                      disabled={isLoading}
                      className={`p-3 rounded-lg transition-colors ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                      title={isRecording ? 'Stop recording' : 'Start voice input'}
                    >
                      {isRecording ? <FiMicOff size={16} /> : <FiMic size={16} />}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading || isRecording}
                    className='bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors'
                  >
                    <FiSend size={16} />
                  </button>
                </div>
                
                {/* Helper Text */}
                <div className='flex items-center justify-center mt-2'>
                  <p className='text-xs text-gray-500 flex flex-wrap items-center justify-center text-center'>
                    <FiHelpCircle size={12} className='mr-1' />
                    <span>Enter to send • Shift+Enter for new line</span>
                    {recognition && (
                      <>
                        <span className='mx-1'>•</span>
                        <FiMic size={10} className='mr-1' />
                        <span>Space to talk • Esc to stop</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};export default ChatBot