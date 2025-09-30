import { create } from "zustand";
import axiosInstance from "../config/axios";

const useAiStore = create((set, get) => ({
  messages: [
    {
      sender: "bot",
      text: "Hello! I'm AquaShield Assistant. How can I help you with health surveillance, water quality, or community health programs today?",
      timestamp: Date.now()
    }
  ],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
  sendMessage: async (content, type = 'general', isVoiceInput = false) => {
    try {
        // Add user message with proper structure for ChatBot component
        get().addMessage({ 
          sender: "user", 
          text: content, 
          timestamp: Date.now(),
          isVoice: isVoiceInput
        });
        
        set({ isLoading: true });
        
        const response = await axiosInstance.post("/ai", { 
          prompt: content, 
          type,
          isVoice: isVoiceInput 
        });
        const { res } = response.data;
        
        // Add AI response with proper structure for ChatBot component
        get().addMessage({ 
          sender: "bot", 
          text: res, 
          timestamp: Date.now(),
          isVoice: false // Bot messages can be converted to speech
        });
    } catch (error) {
        console.error("Error generating response:", error);
        get().addMessage({ 
          sender: "bot", 
          text: "Sorry, something went wrong. Please try again.", 
          timestamp: Date.now() 
        });
    } finally {
        set({ isLoading: false });
    }
  },
  // Keep the old generate method for backward compatibility
  generate: async (prompt, isVoice = false) => {
    return get().sendMessage(prompt, 'general', isVoice);
  },
  
  // Voice-specific method
  generateVoice: async (prompt) => {
    return get().sendMessage(prompt, 'voice', true);
  },
}));

export default useAiStore;
