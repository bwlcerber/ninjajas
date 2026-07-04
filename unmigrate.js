const fs = require('fs');

let code = fs.readFileSync('js/store.js', 'utf8');

const regexMigration = /\/\/\ 3\.\ Migrate old Asset Types[\s\S]*?if\ \(!Object\.values\(typeMap\)\.includes\(oldType\)[\s\S]*?modified = true;\s*\}\s*\}\s*\}/;

const unMigrationScript = `          // 3. Un-migrate broken asset types
          if (item.asset_type && typeof item.asset_type === 'string') {
            const originalItem = window.PORTAL_DATA.materials.find(d => d.id === item.id);
            if (originalItem && originalItem.asset_type) {
              if (item.asset_type !== originalItem.asset_type) {
                item.asset_type = originalItem.asset_type;
                modified = true;
              }
            } else {
              // It's a user-added file that got migrated. Let's try to restore it based on tags or file_type
              if (item.asset_type === 'others') {
                if (item.file_type === 'pdf') item.asset_type = 'pdf';
                else if (item.file_type === 'image') item.asset_type = 'image';
                else if (item.file_type === 'video') item.asset_type = 'video';
                else item.asset_type = 'other'; 
                modified = true;
              } else if (item.asset_type === 'creatives') {
                if (item.tags && item.tags.includes('branding')) item.asset_type = 'branding';
                else if (item.file_type === 'video') item.asset_type = 'video';
                else if (item.file_type === 'image') item.asset_type = 'image';
                else item.asset_type = 'creative';
                modified = true;
              } else if (item.asset_type === 'performance-marketing') {
                item.asset_type = 'report';
                modified = true;
              } else if (item.asset_type === 'case-study') {
                item.asset_type = 'case';
                modified = true;
              } else if (item.asset_type === 'ppc-media-plans') {
                item.asset_type = 'media-plan';
                modified = true;
              } else if (item.asset_type === 'smm-profiles') {
                item.asset_type = 'social-media-profile';
                modified = true;
              }
            }
          }`;

code = code.replace(regexMigration, unMigrationScript);

fs.writeFileSync('js/store.js', code);
console.log('Un-migration script applied to store.js');
