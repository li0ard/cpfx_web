<script setup lang="ts">
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { KeyRound, CircleAlert } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { proceedPFX } from "@/cpfx/index"
import { ref } from 'vue'

const fileInput = ref(null)
const pfxContent = ref<Uint8Array>();
const password = ref("");
const result = ref("");
let selectedFile: File | null = null

const handleFileChange = (event: Event) => {
    const files = (event.target as HTMLInputElement).files as FileList
    if (files.length > 0) selectedFile = files[0];
    else selectedFile = null;
}

const onReadFile = () => {
    if (!selectedFile) {
        alert("Пожалуйста, выберите файл");
        return
    }

    if(selectedFile.type !== "application/x-pkcs12") {
        alert("Пожалуйста, выберите .pfx/.p12 файл");
        return;
    }

    const reader = new FileReader()

    reader.onload = (e) => {
        pfxContent.value = new Uint8Array((e.target as FileReader).result as ArrayBuffer)
        result.value = proceedPFX(pfxContent.value, password.value)
        if(result.value == "") {
            alert("Произошла ошибка. Описание ошибки находится в консоли");
            return;
        }

        const url = URL.createObjectURL(new Blob([result.value], { type: 'text/plain' }))
        const link = document.createElement('a')
        link.href = url
        link.download = "exported.pem"
        link.click()

        URL.revokeObjectURL(url)
        result.value = ""
    }

    reader.onerror = () => alert('Ошибка при чтении файла')
    reader.readAsArrayBuffer(selectedFile)
}
</script>

<template>
    <header class="sticky z-40 top-0 bg-background/80 backdrop-blur-lg border-b border-border">
        <div class="container flex h-14 max-w-screen-2xl items-center">
            <div class="mr-4 md:mr-1 md:flex">
                <a href="/" class="ml-4 mr-4 md:mr-2 lg:mr-6 flex items-center lg:space-x1 xl:space-x-2"><span class="font-bold"> cpfx web</span></a>
            </div>
        </div>
    </header>
    <div class="flex min-h-screen flex-col bg-background">
        <div class="flex-1 bg-background">
            <main class="w-full">
                <div class="relative">
                    <div class="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 page-header pb-8 page-header pb-8">
                        <h1 class="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">cpfx web</h1>
                        <span class="max-w-[750px] text-center text-lg font-light text-foreground">
                            Извлечение приватного ключа из PFX КриптоПро
                        </span>
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
                        <div class="mt-5 w-[414px] max-sm:w-full max-sm:p-3 max-w-[750px] text-sm font-light">
                            <Alert>
                                <CircleAlert class="h-4 w-4" />
                                <AlertTitle>Внимание!</AlertTitle>
                                <AlertDescription>Все операции производятся локально в вашем браузере. Ваш приватный ключ не покидает эту вкладку!</AlertDescription>
                            </Alert>
                        </div>
                        <div class="mt-5 max-w-[750px] text-center text-sm font-light text-gray-500">
                            <p><a href="https://github.com/li0ard/cpfx_web" class="underline">GitHub</a></p>
                            <p>&copy; {{ new Date().getFullYear() }} <a href="https://li0ard.rest" target="_blank" class="underline">li0ard</a></p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<style>
* {
    font-family: "Golos Text", sans-serif;
}
</style>
