<script lang="ts">
    import { KeyRound } from "@lucide/svelte";
    import { Button } from "./ui/button";
    import { Input } from "./ui/input";
    import { Label } from "./ui/label";
    import { proceedCryptoProContainer } from "@li0ard/cpfx";

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

        const result = await proceedCryptoProContainer(
            containerFiles.header,
            containerFiles.masks,
            containerFiles.primary,
            password
        );

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