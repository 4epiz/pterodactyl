import React from 'react';
import { Route } from 'react-router';
import { motion } from 'framer-motion';

/**
 * Animates page content in whenever the route changes. Pages are not animated
 * out, which keeps navigation feeling immediate.
 */
const TransitionRouter: React.FC = ({ children }) => {
    return (
        <Route
            render={({ location }) => (
                <motion.section
                    key={location.pathname + location.search}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                    {children}
                </motion.section>
            )}
        />
    );
};

export default TransitionRouter;
