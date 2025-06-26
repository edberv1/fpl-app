import React, { createContext, useState } from 'react';

export const FplContext = createContext();

export const FplProvider = ({ children }) => {
  const [fplId, setFplId] = useState('');
  const [team, setTeam] = useState([]);
  const [event, setEvent] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  return (
    <FplContext.Provider value={{ fplId, setFplId, team, setTeam, event, setEvent, currentEventId, setCurrentEventId }}>
      {children}
    </FplContext.Provider>
  );
};
