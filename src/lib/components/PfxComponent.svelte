<script lang="ts">
    import { KeyRound } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { proceedPFX } from "@li0ard/cpfx";

    let files = $state<FileList>();
    let password = $state("");

    const onReadFile = () => {
        if(!files) {
            alert("Пожалуйста, выберите файл");
            return;
        }
        const file = files[0];
        
        if(file.type !== "application/x-pkcs12") {
            alert("Пожалуйста, выберите .pfx/.p12 файл");
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => alert('Ошибка при чтении файла');
        reader.onload = async (e) => {
            const pfxContent = new Uint8Array((e.target as FileReader).result as ArrayBuffer);
            const result = await proceedPFX(pfxContent, password);

            if(!result.ok) {
                alert("Произошла ошибка. Описание ошибки находится в консоли");
                return;
            }

            const url = URL.createObjectURL(new Blob([result.pem], { type: 'text/plain' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = "exported.pem";
            link.click();

            URL.revokeObjectURL(url);
        }
        reader.readAsArrayBuffer(file);
    }
</script>
<div class="mt-5 max-w-187.5 text-lg font-light text-foreground">
    <div class="w-full">
        <Label>PFX файл</Label>
        <Input bind:files type="file" class="mt-2" />
    </div>
    <div class="w-full mt-2">
        <Label>Пароль</Label>
        <Input bind:value={password} type="password" class="mt-2" />
    </div>
    <div class="w-full mt-2">
        <Button onclick={onReadFile} class="w-full"><KeyRound class="w-4 h-4 inline" />Извлечь</Button>
    </div>
</div>