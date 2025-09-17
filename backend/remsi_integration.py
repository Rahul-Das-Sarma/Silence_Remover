"""
Integration with Remsi for silence detection
This is a simplified version - you would integrate with the actual Remsi script
from https://github.com/bambax/Remsi
"""

import subprocess
import re
import tempfile
import os
from typing import List, Tuple

class RemsiProcessor:
    def __init__(self):
        self.temp_dir = "temp_processing"
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def detect_silence(self, video_path: str, silence_threshold: str = "-50dB", min_duration: float = 1.0) -> List[Tuple[float, float]]:
        """
        Detect silence in video using ffmpeg and return silence segments
        
        Args:
            video_path: Path to the input video
            silence_threshold: Silence threshold in dB (default: -50dB)
            min_duration: Minimum duration of silence to detect (default: 1.0 seconds)
            
        Returns:
            List of tuples (start_time, end_time) for silence segments
        """
        try:
            # Run ffmpeg silence detection
            cmd = [
                'ffmpeg',
                '-i', video_path,
                '-af', f'silencedetect=n={silence_threshold}:d={min_duration}',
                '-f', 'null',
                '-'
            ]
            
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            # Parse the output to extract silence segments
            silence_segments = self._parse_silence_output(result.stdout)
            
            return silence_segments
            
        except Exception as e:
            print(f"Error detecting silence: {e}")
            return []
    
    def _parse_silence_output(self, output: str) -> List[Tuple[float, float]]:
        """Parse ffmpeg silence detection output"""
        silence_segments = []
        
        # Regular expressions to match silence start and end
        silence_start_pattern = r'silence_start: ([\d.]+)'
        silence_end_pattern = r'silence_end: ([\d.]+)'
        
        lines = output.split('\n')
        current_start = None
        
        for line in lines:
            # Check for silence start
            start_match = re.search(silence_start_pattern, line)
            if start_match:
                current_start = float(start_match.group(1))
                continue
            
            # Check for silence end
            end_match = re.search(silence_end_pattern, line)
            if end_match and current_start is not None:
                end_time = float(end_match.group(1))
                silence_segments.append((current_start, end_time))
                current_start = None
        
        return silence_segments
    
    def create_filter_complex(self, silence_segments: List[Tuple[float, float]], video_duration: float) -> str:
        """
        Create ffmpeg filter complex to remove silence segments
        
        Args:
            silence_segments: List of (start, end) tuples for silence
            video_duration: Total duration of the video
            
        Returns:
            FFmpeg filter complex string
        """
        if not silence_segments:
            # No silence detected, return identity filter
            return "[0:v][0:a]concat=n=1:v=1:a=1[out]"
        
        # Create segments for non-silent parts
        non_silent_segments = []
        last_end = 0.0
        
        for start, end in silence_segments:
            if start > last_end:
                # Add non-silent segment
                non_silent_segments.append((last_end, start))
            last_end = end
        
        # Add final segment if there's content after the last silence
        if last_end < video_duration:
            non_silent_segments.append((last_end, video_duration))
        
        if not non_silent_segments:
            # Entire video is silence
            return "[0:v]trim=duration=0.1,setpts=PTS-STARTPTS[outv];[0:a]atrim=duration=0.1,asetpts=PTS-STARTPTS[outa];[outv][outa]concat=n=1:v=1:a=1[out]"
        
        # Create filter complex for each non-silent segment
        filters = []
        for i, (start, end) in enumerate(non_silent_segments):
            filters.append(f"[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS[v{i}]")
            filters.append(f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[a{i}]")
        
        # Concatenate all segments
        v_inputs = "".join([f"[v{i}]" for i in range(len(non_silent_segments))])
        a_inputs = "".join([f"[a{i}]" for i in range(len(non_silent_segments))])
        
        filters.append(f"{v_inputs}concat=n={len(non_silent_segments)}:v=1:a=0[outv]")
        filters.append(f"{a_inputs}concat=n={len(non_silent_segments)}:v=0:a=1[outa]")
        filters.append("[outv][outa]concat=n=1:v=1:a=1[out]")
        
        return ";".join(filters)
    
    def process_video(self, input_path: str, output_path: str, silence_threshold: str = "-50dB", min_duration: float = 1.0) -> bool:
        """
        Process video to remove silence segments
        
        Args:
            input_path: Path to input video
            output_path: Path to output video
            silence_threshold: Silence threshold in dB
            min_duration: Minimum silence duration to remove
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get video duration
            probe_cmd = ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', input_path]
            result = subprocess.run(probe_cmd, capture_output=True, text=True)
            video_duration = float(result.stdout.strip())
            
            # Detect silence
            silence_segments = self.detect_silence(input_path, silence_threshold, min_duration)
            
            # Create filter complex
            filter_complex = self.create_filter_complex(silence_segments, video_duration)
            
            # Apply the filter
            process_cmd = [
                'ffmpeg',
                '-i', input_path,
                '-filter_complex', filter_complex,
                '-map', '[out]',
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-y',  # Overwrite output file
                output_path
            ]
            
            subprocess.run(process_cmd, check=True)
            
            print(f"Successfully processed video: {len(silence_segments)} silence segments removed")
            return True
            
        except Exception as e:
            print(f"Error processing video: {e}")
            return False

# Example usage
if __name__ == "__main__":
    processor = RemsiProcessor()
    
    # Example: Process a video
    input_video = "input.mp4"
    output_video = "output.mp4"
    
    if processor.process_video(input_video, output_video):
        print("Video processing completed successfully!")
    else:
        print("Video processing failed!")
