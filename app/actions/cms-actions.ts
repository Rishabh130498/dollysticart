'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateCmsPaths(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p, 'page');
    }
    revalidatePath('/', 'layout');
  } catch (err) {
    console.error('Failed to revalidate CMS paths:', paths, err);
  }
}
