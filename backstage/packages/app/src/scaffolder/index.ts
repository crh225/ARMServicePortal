import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import { AzureResourceGroupPickerComponent } from './AzureResourceGroupPicker';
import { ContainerImagePickerComponent } from './ContainerImagePicker';

export const AzureResourceGroupPickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'AzureResourceGroupPicker',
    component: AzureResourceGroupPickerComponent,
  }),
);

export const ContainerImagePickerExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'ContainerImagePicker',
    component: ContainerImagePickerComponent,
  }),
);
