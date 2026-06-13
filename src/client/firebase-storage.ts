import { getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';

export const storage = getStorage(getApp());
