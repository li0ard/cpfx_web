<script setup lang="ts">
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-vue-next";
import { ref } from "vue";
import { proceedPFX } from "@/cpfx";

const fileInput = ref(null);
const pfxContent = ref<Uint8Array>();
let selectedFile: File | null = null;
const password = ref("");
const handleFileChange = (event: Event) => {
    const files = (event.target as HTMLInputElement).files as FileList;
    if (files.length > 0) selectedFile = files[0];
    else selectedFile = null;
}

const onReadFile = () => {
    if (!selectedFile) {
        alert("Пожалуйста, выберите файл");
        return;
    }

    if(selectedFile.type !== "application/x-pkcs12") {
        alert("Пожалуйста, выберите .pfx/.p12 файл");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        pfxContent.value = new Uint8Array((e.target as FileReader).result as ArrayBuffer);
        let cpfxResult = proceedPFX(pfxContent.value, password.value);
        
        if(!cpfxResult.ok) {
            alert("Произошла ошибка. Описание ошибки находится в консоли");
            return;
        }

        const url = URL.createObjectURL(new Blob([cpfxResult.pem], { type: 'text/plain' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = "exported.pem";
        link.click();

        URL.revokeObjectURL(url);
    }

    reader.onerror = () => alert('Ошибка при чтении файла');
    reader.readAsArrayBuffer(selectedFile);
}
</script>
<template>
    <div class="mt-5 max-w-[750px] text-lg font-light text-foreground">
        <div class="w-full">
            <Label>PFX файл</Label>
            <Input @change="handleFileChange" ref="fileInput" type="file" class="mt-2" />
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