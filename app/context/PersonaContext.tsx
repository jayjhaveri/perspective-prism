"use client";

import React, { createContext, useContext, useState } from "react";

export interface Persona {
    persona_id: string;
    name: string;
    style: string;
    prompt: string;
    model?: string;
}

interface PersonaContextType {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    personas: Persona[];
    setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>; // <-- FIXED
    selectedPersonas: Persona[];
    setSelectedPersonas: React.Dispatch<React.SetStateAction<Persona[]>>; // <-- FIXED
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [input, setInput] = useState("");
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);

    return (
        <PersonaContext.Provider
            value={{
                input,
                setInput,
                personas,
                setPersonas,
                selectedPersonas,
                setSelectedPersonas,
            }}
        >
            {children}
        </PersonaContext.Provider>
    );
};

export const usePersonaContext = () => {
    const context = useContext(PersonaContext);
    if (!context) {
        throw new Error("usePersonaContext must be used within a PersonaProvider");
    }
    return context;
};