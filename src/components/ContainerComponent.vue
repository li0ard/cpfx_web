<script setup lang="ts">
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-vue-next";
import { ref } from "vue";
import { proceedCryptoProContainer } from "@/ckey";

const fileInput = ref(null);
const password = ref("");

let selectedFiles: FileList | null = null;
const handleFileChange = (event: Event) => {
    const files = (event.target as HTMLInputElement).files as FileList;
    if (files.length > 0) selectedFiles = files;
    else selectedFiles = null;
}

const onReadFile = async () => {
    let containerFiles: Record<string, Uint8Array | null> = {
        primary: null,
        masks: null,
        header: null,
    }

    if(selectedFiles == null || selectedFiles.length == 0) {
        alert("Выберите файлы контейнера (header.key, masks.key, primary.key)");
        return;
    }

    const readFileAsArrayBuffer = (file: File): Promise<Uint8Array> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const content = new Uint8Array(reader.result as ArrayBuffer);
                resolve(content);
            }
            reader.onerror = () => reject(new Error(`Ошибка при чтении файла: ${file.name}`));
            reader.readAsArrayBuffer(file);
        });
    }

    const readPromises = Array.from(selectedFiles).map(async (file) => {
        try {
            const content = await readFileAsArrayBuffer(file);

            switch (file.name.toLowerCase()) {
                case "header.key":
                    containerFiles.header = content;
                break;
                case "masks.key":
                    containerFiles.masks = content;
                break;
                case "primary.key":
                    containerFiles.primary = content;
                break;
                default:
                    console.warn(`Неизвестный файл: ${file.name}`);
                break;
            }
        } catch (err) {
            alert(`Ошибка при чтении файла ${file.name}`);
            throw err;
        }
    });

    await Promise.all(readPromises);

    if (!containerFiles.header || !containerFiles.masks || !containerFiles.primary) {
        alert("Выберите файлы контейнера (header.key, masks.key, primary.key)");
        return;
    }

    let ckeyResult = proceedCryptoProContainer(containerFiles.header, containerFiles.masks, containerFiles.primary, password.value);
    if(!ckeyResult.ok) {
        alert("Произошла ошибка. Описание ошибки находится в консоли");
        return;
    }

    const url = URL.createObjectURL(new Blob([ckeyResult.pem], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = "exported.pem";
    link.click();

    URL.revokeObjectURL(url);
}
</script>
<template>
    <div class="mt-5 max-w-[750px] text-lg font-light text-foreground">
        <div class="w-full">
            <Label>Файлы header.key, masks.key, primary.key</Label>
            <Input @change="handleFileChange" accept=".key" multiple ref="fileInput" type="file" class="mt-2" />
        </div>
        <div class="w-full mt-2">
            <Label>Пароль</Label>
            <Input v-model="password" type="password" class="mt-2" />
        </div>
        <div class="w-full mt-2">
            <Button @click="onReadFile" class="w-full"><KeyRound class="w-4 h-4 inline" />Извлечь</Button>
        </div>
    </div>
</template>