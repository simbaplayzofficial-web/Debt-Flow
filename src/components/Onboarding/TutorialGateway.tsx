import React, { useEffect } from 'react';
import { useStore } from '../../store';
import { TutorialOverlay } from './TutorialOverlay';

export const TutorialGateway = () => {
    const { currentUser, isTutorialRunning } = useStore();
    
    useEffect(() => {
        // Only run if user is logged in, has not completed tutorial, and tutorial isn't running.
        if (currentUser && currentUser.hasCompletedTutorial === false && !isTutorialRunning) {
            // Trigger tutorial
            useStore.setState({ isTutorialRunning: true });
        }
    }, [currentUser, isTutorialRunning]);
    
    return <TutorialOverlay />;
}
