import os

file_path = r'c:\wamp64\www\Sergeva\src\components\client-files\client-files.component.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Content to insert for Create Modal
insert_create = """
        <!-- Contactos Adicionales -->
        <div class="md:col-span-2 border-t pt-4 dark:border-slate-700">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-900 dark:text-white">
              Contactos Adicionales
            </label>
            <button type="button" (click)="agregarContactoTemporal('nuevo')"
              class="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300">
              + Agregar
            </button>
          </div>
          
          @if (nuevoCliente.contactos_adicionales && nuevoCliente.contactos_adicionales.length > 0) {
            <div class="space-y-2">
              @for (contacto of nuevoCliente.contactos_adicionales; track $index) {
                <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                  <span class="text-gray-700 dark:text-gray-300">{{ contacto.nombre_completo }}</span>
                  <button type="button" (click)="removerContactoTemporal('nuevo', $index)" class="text-red-500 hover:text-red-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              }
            </div>
          } @else {
            <p class="text-xs text-gray-500 italic">No hay contactos adicionales.</p>
          }
        </div>"""

# Content to insert for Edit Modal
insert_edit = """
        <!-- Contactos Adicionales -->
        <div class="md:col-span-2 border-t pt-4 dark:border-slate-700">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-900 dark:text-white">
              Contactos Adicionales
            </label>
            <button type="button" (click)="agregarContactoTemporal('editar')"
              class="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300">
              + Agregar
            </button>
          </div>
          
          @if (clienteEditar()?.contactos_adicionales?.length) {
            <div class="space-y-2">
              @for (contacto of clienteEditar()!.contactos_adicionales; track $index) {
                <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                  <span class="text-gray-700 dark:text-gray-300">{{ contacto.nombre_completo }}</span>
                  <button type="button" (click)="removerContactoTemporal('editar', $index)" class="text-red-500 hover:text-red-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              }
            </div>
          } @else {
            <p class="text-xs text-gray-500 italic">No hay contactos adicionales.</p>
          }
        </div>"""

# Markers to find
marker_create = 'placeholder="Juan Pérez" required>\n        </div>'
marker_edit = 'class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-gray-400 dark:text-white"\n            required>\n        </div>'

# Apply replacements
if marker_create in content:
    content = content.replace(marker_create, marker_create + '\n' + insert_create)
    print("Create modal updated.")
else:
    print("Create modal marker not found.")

if marker_edit in content:
    content = content.replace(marker_edit, marker_edit + '\n' + insert_edit)
    print("Edit modal updated.")
else:
    print("Edit modal marker not found.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
