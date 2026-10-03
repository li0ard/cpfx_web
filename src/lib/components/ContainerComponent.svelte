<script lang="ts">
    import { KeyRound } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { proceed_cryptopro, encodePrivateKeyToPem } from "@li0ard/cpfx";

    let files = $state<FileList>();
    let password = $state("");

    const onReadFile = async () => {
        let containerFiles: Record<string, Uint8Array | null> = {
            primary: null,
            masks: null,
            header: null,
        }

        if(!files || files.length == 0) {
            alert("Выберите файлы контейнера (header.key, masks.key, primary.key)");
            return;
        }

        const readFileAsArrayBuffer = (file: File): Promise<Uint8Array> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const content = new Uint8Array(reader.result as ArrayBuffer);
                resolve(content);
            }
            reader.onerror = () => reject(new Error(`Ошибка при чтении файла: ${file.name}`));
            reader.readAsArrayBuffer(file);
        });

        const readPromises = Array.from(files).map(async (file) => {
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

        try {
            const result = await proceed_cryptopro(
                containerFiles.header,
                containerFiles.masks,
                containerFiles.primary,
                password
            );

            const url = URL.createObjectURL(new Blob([encodePrivateKeyToPem(result)], { type: 'text/plain' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = "exported.pem";
            link.click();

            URL.revokeObjectURL(url);
        } catch(e) {
            console.error(e);
            return alert("Произошла ошибка. Описание ошибки находится в консоли");
        }
    }
</script>
<div class="mt-5 max-w-187.5 text-lg font-light text-foreground">
    <div class="w-full">
        <Label>Файлы header.key, masks.key, primary.key</Label>
        <Input bind:files accept=".key" multiple type="file" class="mt-2" />
    </div>
    <div class="w-full mt-2">
        <Label>Пароль</Label>
        <Input bind:value={password} type="password" class="mt-2" />
    </div>
    <div class="w-full mt-2">
        <Button onclick={onReadFile} class="w-full"><KeyRound class="w-4 h-4 inline" />Извлечь</Button>
    </div>
</div>