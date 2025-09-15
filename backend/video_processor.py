import os
import subprocess
import json
import tempfile
from typing import Optional
import whisper
import ffmpeg
from pathlib import Path
from remsi_integration import RemsiProcessor

class VideoProcessor:
    def __init__(self):
        self.whisper_model = None
        self.temp_dir = "temp_processing"
        self.remsi_processor = RemsiProcessor()
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def get_video_duration(self, file_path: str) -> float:
        """Get video duration in seconds"""
        try:
            probe = ffmpeg.probe(file_path)
            duration = float(probe['streams'][0]['duration'])
            return duration
        except Exception as e:
            print(f"Error getting video duration: {e}")
            return 0.0
    
    def process_with_ffmpeg(self, file_path: str) -> str:
        """
        Process video using ffmpeg + Remsi for free tier
        """
        try:
            # Get video duration
            duration = self.get_video_duration(file_path)
            
            # For free tier, only process videos under 1 minute
            if duration > 60:
                raise ValueError("Free tier only supports videos under 1 minute")
            
            # Create output path
            output_dir = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            name, ext = os.path.splitext(filename)
            output_path = os.path.join(output_dir, f"processed_{filename}")
            
            # Use Remsi processor for silence detection and removal
            success = self.remsi_processor.process_video(
                input_path=file_path,
                output_path=output_path,
                silence_threshold="-50dB",
                min_duration=1.0
            )
            
            if not success:
                raise Exception("Failed to process video with Remsi")
            
            return output_path
            
        except Exception as e:
            print(f"Error processing video with ffmpeg: {e}")
            raise
    
    def process_with_whisper(self, file_path: str) -> str:
        """
        Process video using OpenAI Whisper for premium tier
        """
        try:
            # Load Whisper model if not already loaded
            if self.whisper_model is None:
                self.whisper_model = whisper.load_model("base")
            
            # Create output path
            output_dir = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            name, ext = os.path.splitext(filename)
            output_path = os.path.join(output_dir, f"processed_{filename}")
            
            # Extract audio for Whisper processing
            audio_path = os.path.join(self.temp_dir, f"audio_{filename}.wav")
            ffmpeg.input(file_path).output(audio_path, acodec='pcm_s16le').run(overwrite_output=True)
            
            # Transcribe with Whisper
            result = self.whisper_model.transcribe(audio_path)
            
            # Get speech segments
            segments = result.get('segments', [])
            
            if segments:
                # Create filter complex for removing silence
                filter_complex = self._create_whisper_filter_complex(segments)
                
                # Apply the filter
                process_cmd = [
                    'ffmpeg', '-i', file_path,
                    '-filter_complex', filter_complex,
                    '-map', '[out]',
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-y', output_path
                ]
                
                subprocess.run(process_cmd, check=True)
            else:
                # No speech detected, just copy the file
                subprocess.run(['ffmpeg', '-i', file_path, '-c', 'copy', '-y', output_path], check=True)
            
            # Clean up temporary audio file
            if os.path.exists(audio_path):
                os.remove(audio_path)
            
            return output_path
            
        except Exception as e:
            print(f"Error processing video with Whisper: {e}")
            raise
    
    def _parse_silence_output(self, output: str) -> list:
        """Parse ffmpeg silence detection output"""
        segments = []
        lines = output.split('\n')
        
        for line in lines:
            if 'silence_start' in line:
                # Extract start time
                start_time = float(line.split('silence_start: ')[1].split()[0])
            elif 'silence_end' in line:
                # Extract end time
                end_time = float(line.split('silence_end: ')[1].split()[0])
                segments.append((start_time, end_time))
        
        return segments
    
    def _create_filter_complex(self, segments: list) -> str:
        """Create ffmpeg filter complex for removing silence segments"""
        if not segments:
            return "[0:v][0:a]concat=n=1:v=1:a=1[out]"
        
        # Create segments for non-silent parts
        filters = []
        for i, (start, end) in enumerate(segments):
            filters.append(f"[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS[v{i}]")
            filters.append(f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[a{i}]")
        
        # Concatenate all segments
        v_inputs = "".join([f"[v{i}]" for i in range(len(segments))])
        a_inputs = "".join([f"[a{i}]" for i in range(len(segments))])
        
        filters.append(f"{v_inputs}concat=n={len(segments)}:v=1:a=0[outv]")
        filters.append(f"{a_inputs}concat=n={len(segments)}:v=0:a=1[outa]")
        filters.append("[outv][outa]concat=n=1:v=1:a=1[out]")
        
        return ";".join(filters)
    
    def _create_whisper_filter_complex(self, segments: list) -> str:
        """Create ffmpeg filter complex from Whisper segments"""
        if not segments:
            return "[0:v][0:a]concat=n=1:v=1:a=1[out]"
        
        # Create segments for speech parts
        filters = []
        for i, segment in enumerate(segments):
            start = segment['start']
            end = segment['end']
            filters.append(f"[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS[v{i}]")
            filters.append(f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[a{i}]")
        
        # Concatenate all segments
        v_inputs = "".join([f"[v{i}]" for i in range(len(segments))])
        a_inputs = "".join([f"[a{i}]" for i in range(len(segments))])
        
        filters.append(f"{v_inputs}concat=n={len(segments)}:v=1:a=0[outv]")
        filters.append(f"{a_inputs}concat=n={len(segments)}:v=0:a=1[outa]")
        filters.append("[outv][outa]concat=n=1:v=1:a=1[out]")
        
        return ";".join(filters)
