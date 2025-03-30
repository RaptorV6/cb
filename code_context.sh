#!/bin/bash

# Tento skript je přizpůsoben pro zpracování PHP souborů, ignoruje js a specifické složky
# Umístěte tento soubor do kořenové složky vašeho projektu
# spusťte příkaz chmod +x get_php_code_context.sh
# poté spusťte ./_code_context.sh

# Použijte aktuální adresář jako projektový adresář
project_dir=$(pwd)

# Použijte pevný název pro výstupní soubor v aktuálním adresáři
output_file="${project_dir}/php_code_context.txt"
structure_file="${project_dir}/project_structure.txt"

echo "Project directory: $project_dir"
echo "Output file: $output_file"
echo "Structure file: $structure_file"

# Zkontrolujte, zda výstupní soubor existuje, a pokud ano, odstraňte jej
if [ -f "$output_file" ]; then
  echo "Odstraňuji stávající výstupní soubor"
  rm "$output_file"
fi
if [ -f "$structure_file" ]; then
  echo "Odstraňuji stávající soubor se strukturou"
  rm "$structure_file"
fi

# Funkce pro vytvoření struktury stromu
generate_tree() {
  local dir_path="$1"
  local indent="$2"
  
  # Procházejte všechny soubory a složky v aktuálním adresáři
  for entry in "$dir_path"/*; do
    if [ -d "$entry" ]; then
      # Pokud je adresář, vypište jej a pokračujte rekurzivně
      echo "${indent}├── $(basename "$entry")" >> "$structure_file"
      generate_tree "$entry" "$indent│   "
    elif [ -f "$entry" ]; then
      # Pokud je soubor, vypište jej
      echo "${indent}├── $(basename "$entry")" >> "$structure_file"
    fi
  done
}

# Vytvořte stromovou strukturu projektu
echo "Vytvářím stromovou strukturu projektu:"
echo "$project_dir" > "$structure_file"
generate_tree "$project_dir" ""
cat "$structure_file"

# Seznam adresářů, které se mají prohledávat
directories=("modal" "fast" ".")

# Seznam složek, které se mají ignorovat
ignore_directories=("scripts_sdilene" "scripts_local" "bootstrap" "phpmailer")

# Seznam typů souborů, které se mají ignorovat
ignore_files=("*.ico" "*.png" "*.jpg" "*.jpeg" "*.gif" "*.svg" "*.html" "*.exe" "*.sh" "*.txt" "*.md" "*.log")  

# Rekurzivní funkce pro čtení souborů a připojování jejich obsahu
read_files() {
  for entry in "$1"/*
  do
    # Zkontroluj, zda je položka adresář
    if [ -d "$entry" ]; then
      # Zkontroluj, zda by měl být adresář ignorován
      should_ignore_dir=false
      for ignore_dir in "${ignore_directories[@]}"; do
        if [[ "$entry" == *"$ignore_dir"* ]]; then
          should_ignore_dir=true
          break
        fi
      done
      
      # Pokud by adresář neměl být ignorován, pokračuj rekurzivně
      if ! $should_ignore_dir; then
        echo "Vstupuji do adresáře: $entry"
        read_files "$entry"
      else
        echo "Ignoruji adresář: $entry"
      fi
    elif [ -f "$entry" ]; then
      # Zkontrolujte, zda typ souboru by měl být ignorován
      should_ignore_file=false
      for ignore_pattern in "${ignore_files[@]}"; do
        if [[ "$entry" == $ignore_pattern ]]; then
          should_ignore_file=true
          break
        fi
      done

      # Pokud typ souboru by neměl být ignorován, připojte jeho relativní cestu a obsah do výstupního souboru
      if ! $should_ignore_file; then
        relative_path=${entry#"$project_dir/"}
        echo "Zpracovávám soubor: $relative_path"
        echo "// File: $relative_path" >> "$output_file"
        cat "$entry" >> "$output_file"
        echo "" >> "$output_file"
      else
        echo "Ignoruji soubor: $entry"
      fi
    fi
  done
}

# Zavolejte rekurzivní funkci pro každý specifikovaný adresář v projektovém adresáři
for dir in "${directories[@]}"; do
  if [ -d "${project_dir}/${dir}" ]; then
    echo "Začínám číst adresář: ${project_dir}/${dir}"
    read_files "${project_dir}/${dir}"
  else
    echo "Adresář neexistuje: ${project_dir}/${dir}"
  fi
done

echo "Hotovo. Výstup zapsán do $output_file"
