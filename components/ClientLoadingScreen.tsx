'use client';

import React from 'react';
import { SqueezeLoader } from './SqueezeLoader';

export function ClientLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50">
      <SqueezeLoader
        size={60}
        color1="#3498db"
        color2="#e74c3c"
        spinDuration={10}
        squeezeDuration={3}
        containerClassName="bg-gray-50"
      />
    </div>
  );
}

