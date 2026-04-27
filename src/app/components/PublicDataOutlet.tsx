import React from 'react';
import { Outlet } from 'react-router';
import { DataProvider } from '../contexts/DataContext';

export function PublicDataOutlet() {
  return (
    <DataProvider>
      <Outlet />
    </DataProvider>
  );
}
